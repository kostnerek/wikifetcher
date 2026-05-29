import { Test, TestingModule } from '@nestjs/testing';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';
import { DownloadStatus } from './downloads.entity';

describe('DownloadsController', () => {
  let controller: DownloadsController;
  let service: DownloadsService;

  const mockDownload = {
    id: 1,
    languageId: 1,
    fileName: 'wikipedia_en_all_maxi_2026-05.zim',
    fileSize: 98765432100,
    filePath: 'en/wikipedia_en_all_maxi_2026-05.zim',
    status: DownloadStatus.COMPLETED,
    progress: 100,
    isActive: true,
    errorMessage: null,
    startedAt: new Date(),
    completedAt: new Date(),
    createdAt: new Date(),
  };

  const mockDownloadsService = {
    findAll: jest.fn().mockResolvedValue({ data: [mockDownload], total: 1 }),
    activate: jest.fn().mockResolvedValue({ ...mockDownload, isActive: true }),
    remove: jest.fn().mockResolvedValue(undefined),
    triggerDownloads: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DownloadsController],
      providers: [
        { provide: DownloadsService, useValue: mockDownloadsService },
      ],
    }).compile();

    controller = module.get<DownloadsController>(DownloadsController);
    service = module.get<DownloadsService>(DownloadsService);
  });

  it('GET /api/downloads returns paginated downloads', async () => {
    const result = await controller.findAll({});
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('POST /api/downloads/:id/activate activates a download', async () => {
    const result = await controller.activate(1);
    expect(result.isActive).toBe(true);
    expect(service.activate).toHaveBeenCalledWith(1);
  });

  it('DELETE /api/downloads/:id removes a download', async () => {
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });

  it('POST /api/downloads/trigger triggers downloads', async () => {
    await controller.trigger();
    expect(service.triggerDownloads).toHaveBeenCalled();
  });
});
