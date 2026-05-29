import { Controller, Get } from '@nestjs/common';
import { KiwixService } from './kiwix.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Download } from '../downloads/downloads.entity';

@Controller('api/kiwix')
export class KiwixController {
  constructor(
    private readonly kiwixService: KiwixService,
    @InjectRepository(Download)
    private readonly downloadRepo: Repository<Download>,
  ) {}

  @Get('status')
  async getStatus() {
    const containerStatus = await this.kiwixService.getStatus();
    const activeDownloads = await this.downloadRepo.find({
      where: { isActive: true },
      relations: ['language'],
    });

    return {
      ...containerStatus,
      activeFiles: activeDownloads.map((d) => ({
        language: d.language.name,
        languageCode: d.language.code,
        fileName: d.fileName,
        fileSize: d.fileSize,
      })),
    };
  }
}
