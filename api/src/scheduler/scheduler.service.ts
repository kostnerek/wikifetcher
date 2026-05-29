import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';
import { SettingsService } from '../settings/settings.service';
import { DownloadsService } from '../downloads/downloads.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private static readonly JOB_NAME = 'wikifetcher-cron';

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService: SettingsService,
    private readonly downloadsService: DownloadsService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    let cronExpression: string;
    try {
      const settings = await this.settingsService.get();
      cronExpression = settings.cronExpression;
    } catch {
      cronExpression = this.config.get<string>('defaultCron')!;
    }
    this.registerCronJob(cronExpression);
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
