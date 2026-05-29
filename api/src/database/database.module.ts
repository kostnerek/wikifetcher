import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Settings } from '../settings/settings.entity';
import { Language } from '../languages/languages.entity';
import { Download } from '../downloads/downloads.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('dbPath'),
        entities: [Settings, Language, Download],
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
