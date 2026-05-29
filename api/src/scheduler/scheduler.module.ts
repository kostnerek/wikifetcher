import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { SettingsModule } from '../settings/settings.module';
import { DownloadsModule } from '../downloads/downloads.module';

@Module({
  imports: [ScheduleModule.forRoot(), SettingsModule, DownloadsModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
