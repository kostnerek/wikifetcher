import { Test, TestingModule } from '@nestjs/testing';
import { ZimCatalogService, ZimEntry } from './zim-catalog.service';

describe('ZimCatalogService', () => {
  let service: ZimCatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZimCatalogService],
    }).compile();

    service = module.get<ZimCatalogService>(ZimCatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('parseDirectoryListing extracts ZIM entries from HTML', () => {
    const html = `
      <a href="wikipedia_en_all_maxi_2026-05.zim">wikipedia_en_all_maxi_2026-05.zim</a> 29-May-2026 10:00  98765432100
      <a href="wikipedia_en_all_nopic_2026-05.zim">wikipedia_en_all_nopic_2026-05.zim</a> 29-May-2026 10:00  12345678900
    `;
    const entries = service.parseDirectoryListing(html, 'en');
    expect(entries).toHaveLength(2);
    expect(entries[0].fileName).toBe('wikipedia_en_all_maxi_2026-05.zim');
    expect(entries[0].hasImages).toBe(true);
    expect(entries[1].hasImages).toBe(false);
  });
});
