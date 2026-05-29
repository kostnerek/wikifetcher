import { Controller, Get, Put, Body, Inject, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SchedulerService } from '../scheduler/scheduler.service';

@Controller('api/settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => SchedulerService))
    private readonly schedulerService: SchedulerService,
  ) {}

  @Get()
  async get() {
    const settings = await this.settingsService.get();
    const nextRun = this.schedulerService.getNextRun();
    return { ...settings, nextRun };
  }

  @Put()
  async update(@Body() dto: UpdateSettingsDto) {
    const settings = await this.settingsService.update(dto);
    if (dto.cronExpression) {
      this.schedulerService.registerCronJob(dto.cronExpression);
    }
    return settings;
  }
}
