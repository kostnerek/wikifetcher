import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SettingsService } from '../settings/settings.service';
import { DownloadsService } from '../downloads/downloads.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private static readonly JOB_NAME = 'wikifetcher-cron';

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly settingsService: SettingsService,
    private readonly downloadsService: DownloadsService,
  ) {}

  async onModuleInit() {
    const settings = await this.settingsService.get();
    this.registerCronJob(settings.cronExpression);
  }

  registerCronJob(cronExpression: string) {
    try {
      this.schedulerRegistry.deleteCronJob(SchedulerService.JOB_NAME);
    } catch {}

    const job = new CronJob(cronExpression, () => {
      this.logger.log('Scheduled download triggered');
      this.downloadsService.triggerDownloads().catch((err) => {
        this.logger.error(
          `Scheduled download failed: ${(err as Error).message}`,
        );
      });
    });

    this.schedulerRegistry.addCronJob(SchedulerService.JOB_NAME, job);
    job.start();
    this.logger.log(`Cron job registered: ${cronExpression}`);
  }

  getNextRun(): Date | null {
    try {
      const job = this.schedulerRegistry.getCronJob(
        SchedulerService.JOB_NAME,
      );
      return job.nextDate().toJSDate();
    } catch {
      return null;
    }
  }
}
