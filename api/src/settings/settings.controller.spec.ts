import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SchedulerService } from '../scheduler/scheduler.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: SettingsService;

  const mockSettings = {
    id: 1,
    cronExpression: '0 3 * * 0',
    maxVersionsToKeep: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSettingsService = {
    get: jest.fn().mockResolvedValue(mockSettings),
    update: jest.fn().mockResolvedValue({
      ...mockSettings,
      cronExpression: '0 4 * * 1',
    }),
  };

  const mockSchedulerService = {
    getNextRun: jest.fn().mockReturnValue(new Date('2026-06-01T03:00:00Z')),
    registerCronJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: SchedulerService, useValue: mockSchedulerService },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('GET /api/settings returns settings with nextRun', async () => {
    const result = await controller.get();
    expect(result.cronExpression).toBe('0 3 * * 0');
    expect(result.nextRun).toBeDefined();
  });

  it('PUT /api/settings updates settings and restarts scheduler', async () => {
    const dto = { cronExpression: '0 4 * * 1' };
    const result = await controller.update(dto);
    expect(result.cronExpression).toBe('0 4 * * 1');
    expect(mockSchedulerService.registerCronJob).toHaveBeenCalledWith(
      '0 4 * * 1',
    );
  });
});
