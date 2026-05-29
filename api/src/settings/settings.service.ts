import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Settings } from './settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Settings)
    private readonly repo: Repository<Settings>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const existing = await this.repo.findOneBy({ id: 1 });
    if (!existing) {
      await this.repo.save({
        id: 1,
        cronExpression: this.config.get<string>('defaultCron'),
        maxVersionsToKeep: this.config.get<number>('defaultMaxVersions'),
      });
    }
  }

  async get(): Promise<Settings> {
    return this.repo.findOneByOrFail({ id: 1 });
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    await this.repo.update(1, dto);
    return this.get();
  }
}
