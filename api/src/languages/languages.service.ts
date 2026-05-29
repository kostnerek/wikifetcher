import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Language } from './languages.entity';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly repo: Repository<Language>,
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
    const langDir = path.join(
      this.config.get<string>('zimDataPath')!,
      language.code,
    );
    await this.repo.remove(language);
    await fs.rm(langDir, { recursive: true, force: true });
  }
}
