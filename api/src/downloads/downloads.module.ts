import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Download } from './downloads.entity';
import { Language } from '../languages/languages.entity';
import { DownloadsService } from './downloads.service';
import { DownloadsController } from './downloads.controller';
import { KiwixModule } from '../kiwix/kiwix.module';
import { ZimCatalogModule } from '../zim-catalog/zim-catalog.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Download, Language]),
    KiwixModule,
    ZimCatalogModule,
    SettingsModule,
  ],
  controllers: [DownloadsController],
  providers: [DownloadsService],
  exports: [DownloadsService],
})
export class DownloadsModule {}
