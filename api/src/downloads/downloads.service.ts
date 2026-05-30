import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Download, DownloadStatus } from './downloads.entity';
import { QueryDownloadsDto } from './dto/query-downloads.dto';
import { Language } from '../languages/languages.entity';
import { KiwixService } from '../kiwix/kiwix.service';
import {
  ZimCatalogService,
  ZimEntry,
  ZimFlavor,
} from '../zim-catalog/zim-catalog.service';
import { SettingsService } from '../settings/settings.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { Readable, Transform } from 'stream';

@Injectable()
export class DownloadsService {
  private readonly logger = new Logger(DownloadsService.name);
  private readonly zimDataPath: string;
  private isDownloading = false;

  constructor(
    @InjectRepository(Download)
    private readonly downloadRepo: Repository<Download>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
    private readonly config: ConfigService,
    private readonly kiwixService: KiwixService,
    private readonly zimCatalogService: ZimCatalogService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
  ) {
    this.zimDataPath = this.config.get<string>('zimDataPath')!;
  }

  async findAll(
    query: QueryDownloadsDto,
  ): Promise<{ data: Download[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.downloadRepo
      .createQueryBuilder('download')
      .leftJoinAndSelect('download.language', 'language')
      .orderBy('download.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.languageId) {
      qb.andWhere('download.languageId = :languageId', {
        languageId: query.languageId,
      });
    }
    if (query.status) {
      qb.andWhere('download.status = :status', { status: query.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async activate(id: number): Promise<Download> {
    const download = await this.downloadRepo.findOne({
      where: { id },
      relations: ['language'],
    });
    if (!download) throw new NotFoundException(`Download #${id} not found`);
    if (download.status !== DownloadStatus.COMPLETED) {
      throw new BadRequestException('Can only activate completed downloads');
    }

    // capture prior active for rollback
    const priorActive = await this.downloadRepo.find({
      where: { languageId: download.languageId, isActive: true },
    });

    await this.downloadRepo.update(
      { languageId: download.languageId, isActive: true },
      { isActive: false },
    );
    download.isActive = true;
    await this.downloadRepo.save(download);

    try {
      const symlinkPath = path.join(
        this.zimDataPath,
        download.language.code,
        'active.zim',
      );
      await fs.rm(symlinkPath, { force: true });
      await fs.symlink(
        path.join(this.zimDataPath, download.filePath),
        symlinkPath,
      );

      const allActive = await this.downloadRepo.find({
        where: { isActive: true },
        relations: ['language'],
      });
      await this.kiwixService.restart(allActive.map((d) => d.filePath));
    } catch (err) {
      this.logger.error(
        `Activation failed for #${id}, rolling back: ${(err as Error).message}`,
      );
      download.isActive = false;
      await this.downloadRepo.save(download);
      for (const p of priorActive) {
        await this.downloadRepo.update(p.id, { isActive: true });
      }
      throw err;
    }

    return download;
  }

  async remove(id: number): Promise<void> {
    const download = await this.downloadRepo.findOneBy({ id });
    if (!download) throw new NotFoundException(`Download #${id} not found`);
    if (download.isActive) {
      throw new BadRequestException('Cannot delete the active download');
    }
    if (download.status === DownloadStatus.DELETING) {
      throw new BadRequestException('Download is already being deleted');
    }

    const priorStatus = download.status;
    await this.downloadRepo.update(id, { status: DownloadStatus.DELETING });

    try {
      const fullPath = path.join(this.zimDataPath, download.filePath);
      await fs.rm(fullPath, { force: true });
      await this.downloadRepo.remove(download);
    } catch (err) {
      await this.downloadRepo.update(id, { status: priorStatus });
      throw err;
    }
  }

  async triggerDownloads(): Promise<void> {
    if (this.isDownloading) {
      this.logger.warn('Download already in progress, skipping');
      return;
    }
    this.isDownloading = true;
    try {
      const languages = await this.languageRepo.find({
        where: { enabled: true },
      });

      for (const lang of languages) {
        await this.downloadForLanguage(lang);
      }
    } finally {
      this.isDownloading = false;
    }
  }

  private async downloadForLanguage(lang: Language): Promise<void> {
    const available = await this.zimCatalogService.getAvailable(lang.code);
    const variant = this.pickVariant(available, lang.withImages);

    if (!variant) {
      this.logger.warn(`No ZIM file found for ${lang.code}`);
      return;
    }
    this.logger.log(
      `Selected ${variant.fileName} (flavor=${variant.flavor}, fullDump=${variant.isFullDump}) for ${lang.code}`,
    );

    const existing = await this.downloadRepo.findOne({
      where: {
        languageId: lang.id,
        fileName: variant.fileName,
        status: DownloadStatus.COMPLETED,
      },
    });
    if (existing) {
      this.logger.log(`Already have ${variant.fileName}, skipping`);
      return;
    }

    const filePath = path.join(lang.code, variant.fileName);
    const fullPath = path.join(this.zimDataPath, filePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const download = await this.downloadRepo.save({
      languageId: lang.id,
      fileName: variant.fileName,
      filePath,
      status: DownloadStatus.DOWNLOADING,
      startedAt: new Date(),
    });

    try {
      const response = await fetch(variant.url);
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const totalSize = parseInt(
        response.headers.get('content-length') || '0',
        10,
      );
      if (totalSize > 0) {
        await this.downloadRepo.update(download.id, { fileSize: totalSize });
      }
      const SAMPLE_INTERVAL_MS = 1000;
      let downloadedSize = 0;
      let lastSampleBytes = 0;
      let lastSampleTime = Date.now();

      const progressTracker = new Transform({
        transform: (chunk: Buffer, _enc, cb) => {
          downloadedSize += chunk.length;
          const now = Date.now();
          const elapsedMs = now - lastSampleTime;
          if (elapsedMs >= SAMPLE_INTERVAL_MS) {
            const speedBps = Math.round(
              ((downloadedSize - lastSampleBytes) * 1000) / elapsedMs,
            );
            const progress =
              totalSize > 0
                ? Math.floor((downloadedSize / totalSize) * 100)
                : 0;
            lastSampleBytes = downloadedSize;
            lastSampleTime = now;
            this.downloadRepo
              .update(download.id, { progress, speedBps })
              .catch((err) =>
                this.logger.warn(
                  `progress update failed: ${(err as Error).message}`,
                ),
              );
          }
          cb(null, chunk);
        },
      });

      await pipeline(
        Readable.fromWeb(response.body as any),
        progressTracker,
        fsSync.createWriteStream(fullPath),
      );

      const stat = await fs.stat(fullPath);
      await this.downloadRepo.update(download.id, {
        status: DownloadStatus.COMPLETED,
        progress: 100,
        speedBps: null,
        fileSize: stat.size,
        completedAt: new Date(),
      });

      this.logger.log(`Downloaded ${variant.fileName}`);
      await this.cleanupOldVersions(lang.id);

      try {
        await this.activate(download.id);
      } catch (err) {
        this.logger.warn(
          `Auto-activate failed for ${variant.fileName}: ${(err as Error).message}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.downloadRepo.update(download.id, {
        status: DownloadStatus.FAILED,
        speedBps: null,
        errorMessage: message,
      });
      await fs.rm(fullPath, { force: true });
      this.logger.error(`Failed to download ${variant.fileName}: ${message}`);
    }
  }

  pickVariant(
    entries: ZimEntry[],
    withImages: boolean,
  ): ZimEntry | undefined {
    if (entries.length === 0) return undefined;

    const imageFilter = (e: ZimEntry): boolean =>
      withImages ? e.hasImages : !e.hasImages;

    const flavorPriority: ZimFlavor[] = withImages
      ? ['maxi', 'mini', 'plain', 'nopic']
      : ['nopic', 'mini', 'plain', 'maxi'];

    const pools: ZimEntry[][] = [
      entries.filter((e) => e.isFullDump && imageFilter(e)),
      entries.filter((e) => e.isFullDump),
      entries.filter(imageFilter),
      entries,
    ];

    for (const pool of pools) {
      if (pool.length === 0) continue;
      for (const flavor of flavorPriority) {
        const matches = pool.filter((e) => e.flavor === flavor);
        if (matches.length === 0) continue;
        matches.sort((a, b) => b.date.localeCompare(a.date));
        return matches[0];
      }
      const sorted = [...pool].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0];
    }
    return undefined;
  }

  private async cleanupOldVersions(languageId: number): Promise<void> {
    const settings = await this.settingsService.get();
    const maxVersions = settings.maxVersionsToKeep;

    const completed = await this.downloadRepo.find({
      where: { languageId, status: DownloadStatus.COMPLETED },
      order: { completedAt: 'DESC' },
    });
    if (completed.length <= maxVersions) return;

    const toDelete = completed.slice(maxVersions).filter((d) => !d.isActive);
    for (const dl of toDelete) {
      await this.downloadRepo.update(dl.id, {
        status: DownloadStatus.DELETING,
      });
      const fullPath = path.join(this.zimDataPath, dl.filePath);
      await fs.rm(fullPath, { force: true });
      await this.downloadRepo.remove(dl);
      this.logger.log(`Cleaned up old version: ${dl.fileName}`);
    }
  }

  async getDiskUsage(): Promise<number> {
    let total = 0;
    const downloads = await this.downloadRepo.find({
      where: { status: DownloadStatus.COMPLETED },
    });
    for (const dl of downloads) {
      total += Number(dl.fileSize);
    }
    return total;
  }
}
