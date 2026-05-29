import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './settings/settings.module';
import { LanguagesModule } from './languages/languages.module';
import { DownloadsModule } from './downloads/downloads.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { KiwixModule } from './kiwix/kiwix.module';
import { ZimCatalogModule } from './zim-catalog/zim-catalog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    SettingsModule,
    LanguagesModule,
    DownloadsModule,
    SchedulerModule,
    KiwixModule,
    ZimCatalogModule,
  ],
})
export class AppModule {}
