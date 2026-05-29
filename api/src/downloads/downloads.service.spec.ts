import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import { DownloadsService } from './downloads.service';
import { Download, DownloadStatus } from './downloads.entity';
import { Language } from '../languages/languages.entity';
import { KiwixService } from '../kiwix/kiwix.service';
import { ZimCatalogService } from '../zim-catalog/zim-catalog.service';
import { SettingsService } from '../settings/settings.service';

describe('DownloadsService', () => {
  let service: DownloadsService;

  const mockDownloadRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockLanguageRepo = {
    find: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => (key === 'zimDataPath' ? '/data/zim' : null)),
  };

  const mockKiwixService = {
    restart: jest.fn().mockResolvedValue(undefined),
  };

  const mockZimCatalogService = {
    getAvailable: jest.fn(),
  };

  const mockSettingsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadsService,
        { provide: getRepositoryToken(Download), useValue: mockDownloadRepo },
        { provide: getRepositoryToken(Language), useValue: mockLanguageRepo },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: KiwixService, useValue: mockKiwixService },
        { provide: ZimCatalogService, useValue: mockZimCatalogService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<DownloadsService>(DownloadsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('activate', () => {
    const mockDownload = {
      id: 1,
      languageId: 1,
      fileName: 'wiki_en.zim',
      filePath: 'en/wiki_en.zim',
      status: DownloadStatus.COMPLETED,
      isActive: false,
      language: { id: 1, code: 'en' },
    };

    it('throws NotFoundException for unknown id', async () => {
      mockDownloadRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.activate(999)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when status is not COMPLETED', async () => {
      mockDownloadRepo.findOne.mockResolvedValueOnce({
        ...mockDownload,
        status: DownloadStatus.DOWNLOADING,
      });
      await expect(service.activate(1)).rejects.toThrow(BadRequestException);
    });

    it('success path calls kiwix.restart with active paths', async () => {
      mockDownloadRepo.findOne.mockResolvedValueOnce({ ...mockDownload });
      // priorActive
      mockDownloadRepo.find.mockResolvedValueOnce([]);
      mockDownloadRepo.update.mockResolvedValue({ affected: 0 });
      mockDownloadRepo.save.mockImplementation(async (d) => d);

      jest.spyOn(fs, 'rm').mockResolvedValue(undefined);
      jest.spyOn(fs, 'symlink').mockResolvedValue(undefined);

      // allActive
      mockDownloadRepo.find.mockResolvedValueOnce([
        { ...mockDownload, isActive: true, filePath: 'en/wiki_en.zim' },
      ]);

      const result = await service.activate(1);

      expect(mockKiwixService.restart).toHaveBeenCalledWith(['en/wiki_en.zim']);
      expect(result.isActive).toBe(true);
    });

    it('rolls back DB on symlink failure', async () => {
      const priorActive = [
        { id: 2, languageId: 1, isActive: true },
      ];
      mockDownloadRepo.findOne.mockResolvedValueOnce({ ...mockDownload });
      mockDownloadRepo.find.mockResolvedValueOnce(priorActive);
      mockDownloadRepo.update.mockResolvedValue({ affected: 0 });
      const saveCalls: any[] = [];
      mockDownloadRepo.save.mockImplementation(async (d) => {
        saveCalls.push({ ...d });
        return d;
      });

      jest.spyOn(fs, 'rm').mockResolvedValue(undefined);
      jest
        .spyOn(fs, 'symlink')
        .mockRejectedValueOnce(new Error('EACCES'));

      await expect(service.activate(1)).rejects.toThrow('EACCES');

      // kiwix should never be called when symlink fails
      expect(mockKiwixService.restart).not.toHaveBeenCalled();

      // download was first saved as active, then saved as inactive (rollback)
      expect(saveCalls.length).toBeGreaterThanOrEqual(2);
      expect(saveCalls[saveCalls.length - 1].isActive).toBe(false);

      // prior active rows restored
      expect(mockDownloadRepo.update).toHaveBeenCalledWith(2, {
        isActive: true,
      });
    });
  });

  describe('remove', () => {
    it('throws BadRequestException when isActive', async () => {
      mockDownloadRepo.findOneBy.mockResolvedValueOnce({
        id: 1,
        isActive: true,
        filePath: 'en/wiki.zim',
      });
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(mockDownloadRepo.remove).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when not found', async () => {
      mockDownloadRepo.findOneBy.mockResolvedValueOnce(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('deletes file then DB row', async () => {
      const row = { id: 1, isActive: false, filePath: 'en/wiki.zim' };
      mockDownloadRepo.findOneBy.mockResolvedValueOnce(row);
      const rmSpy = jest.spyOn(fs, 'rm').mockResolvedValue(undefined);

      await service.remove(1);

      expect(rmSpy).toHaveBeenCalledWith(
        '/data/zim/en/wiki.zim',
        { force: true },
      );
      expect(mockDownloadRepo.remove).toHaveBeenCalledWith(row);
      // rm before remove
      const rmOrder = rmSpy.mock.invocationCallOrder[0];
      const removeOrder =
        mockDownloadRepo.remove.mock.invocationCallOrder[0];
      expect(rmOrder).toBeLessThan(removeOrder);
    });
  });

  describe('triggerDownloads', () => {
    it('concurrency guard: parallel calls run the inner loop only once', async () => {
      // languageRepo.find is the first thing inside the guard
      let resolveFind: (v: any) => void;
      const findPromise = new Promise((res) => {
        resolveFind = res;
      });
      mockLanguageRepo.find.mockReturnValueOnce(findPromise);

      // Start first call — it will await languageRepo.find
      const p1 = service.triggerDownloads();
      // Start second call while the first is still in flight
      const p2 = service.triggerDownloads();

      // Let the second call settle (should skip immediately due to guard)
      await p2;

      // First call should not yet have touched languageRepo.find return path
      expect(mockLanguageRepo.find).toHaveBeenCalledTimes(1);

      // Resolve to let the first finish
      resolveFind!([]);
      await p1;

      expect(mockLanguageRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanupOldVersions', () => {
    it('never deletes the active download', async () => {
      mockSettingsService.get.mockResolvedValueOnce({ maxVersionsToKeep: 1 });

      const completed = [
        {
          id: 1,
          languageId: 1,
          filePath: 'en/new.zim',
          fileName: 'new.zim',
          isActive: false,
          completedAt: new Date('2026-05-20'),
        },
        {
          id: 2,
          languageId: 1,
          filePath: 'en/older.zim',
          fileName: 'older.zim',
          isActive: true,
          completedAt: new Date('2026-05-10'),
        },
        {
          id: 3,
          languageId: 1,
          filePath: 'en/oldest.zim',
          fileName: 'oldest.zim',
          isActive: false,
          completedAt: new Date('2026-05-01'),
        },
      ];
      mockDownloadRepo.find.mockResolvedValueOnce(completed);
      jest.spyOn(fs, 'rm').mockResolvedValue(undefined);

      // call private via any-cast
      await (service as any).cleanupOldVersions(1);

      // Should remove id 3 (oldest, inactive) but NOT id 2 (active)
      const removedRows = mockDownloadRepo.remove.mock.calls.map(
        (c) => c[0],
      );
      const removedIds = removedRows.map((r: any) => r.id);
      expect(removedIds).toContain(3);
      expect(removedIds).not.toContain(2);
    });
  });
});
