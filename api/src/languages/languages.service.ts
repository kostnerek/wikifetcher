import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Language } from './languages.entity';
import { Download, DownloadStatus } from '../downloads/downloads.entity';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly repo: Repository<Language>,
    @InjectRepository(Download)
    private readonly downloadRepo: Repository<Download>,
    private readonly config: ConfigService,
  ) {}

  findAll(): Promise<Language[]> {
    return this.repo.find({ order: { code: 'ASC' } });
  }

  async findOne(id: number): Promise<Language> {
    const lang = await this.repo.findOneBy({ id });
    if (!lang) throw new NotFoundException(`Language #${id} not found`);
    return lang;
  }

  async create(dto: CreateLanguageDto): Promise<Language> {
    const language = this.repo.create({
      code: dto.code,
      name: dto.name,
      withImages: dto.withImages ?? false,
      enabled: true,
    });
    const saved = await this.repo.save(language);
    const langDir = path.join(
      this.config.get<string>('zimDataPath')!,
      saved.code,
    );
    await fs.mkdir(langDir, { recursive: true });
    return saved;
  }

  async update(id: number, dto: UpdateLanguageDto): Promise<Language> {
    const language = await this.findOne(id);
    Object.assign(language, dto);
    return this.repo.save(language);
  }

  async remove(id: number): Promise<void> {
    const language = await this.findOne(id);
    const zimDataPath = this.config.get<string>('zimDataPath')!;

    await this.downloadRepo.update(
      { languageId: id },
      { status: DownloadStatus.DELETING, isActive: false },
    );

    const downloads = await this.downloadRepo.find({ where: { languageId: id } });
    for (const dl of downloads) {
      const fullPath = path.join(zimDataPath, dl.filePath);
      await fs.rm(fullPath, { force: true });
      await this.downloadRepo.remove(dl);
    }

    const langDir = path.join(zimDataPath, language.code);
    await fs.rm(langDir, { recursive: true, force: true });
    await this.repo.remove(language);
  }
}
