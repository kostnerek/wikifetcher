import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './languages.entity';
import { Download } from '../downloads/downloads.entity';
import { LanguagesService } from './languages.service';
import { LanguagesController } from './languages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Language, Download])],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
