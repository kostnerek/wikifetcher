import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KiwixService } from './kiwix.service';

describe('KiwixService', () => {
  let service: KiwixService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        kiwixContainerName: 'kiwix-serve',
        zimDataPath: '/data/zim',
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KiwixService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<KiwixService>(KiwixService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('buildKiwixArgs builds correct arguments from ZIM paths', () => {
    const paths = ['en/wikipedia_en.zim', 'pl/wikipedia_pl.zim'];
    const args = service.buildKiwixArgs(paths);
    expect(args).toEqual([
      '/data/zim/en/wikipedia_en.zim',
      '/data/zim/pl/wikipedia_pl.zim',
    ]);
  });
});
