import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get<SettingsService>(SettingsService);
  });

  it('GET /api/settings returns current settings', async () => {
    const result = await controller.get();
    expect(result).toEqual(mockSettings);
    expect(service.get).toHaveBeenCalled();
  });

  it('PUT /api/settings updates and returns settings', async () => {
    const dto = { cronExpression: '0 4 * * 1' };
    const result = await controller.update(dto);
    expect(result.cronExpression).toBe('0 4 * * 1');
    expect(service.update).toHaveBeenCalledWith(dto);
  });
});
