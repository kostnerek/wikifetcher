import { Test, TestingModule } from '@nestjs/testing';
import { ZimCatalogService } from './zim-catalog.service';

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

  it('parseDirectoryListing returns [] for empty HTML', () => {
    expect(service.parseDirectoryListing('', 'en')).toEqual([]);
  });

  it('parseDirectoryListing returns [] when no entries match', () => {
    const html = `
      <a href="something_else.zim">something_else.zim</a> 29-May-2026 10:00  100
      <a href="readme.txt">readme.txt</a> 29-May-2026 10:00  100
    `;
    expect(service.parseDirectoryListing(html, 'en')).toEqual([]);
  });

  it('parseDirectoryListing does not match entries from a different language', () => {
    const html = `
      <a href="wikipedia_en_all_maxi_2026-05.zim">wikipedia_en_all_maxi_2026-05.zim</a> 29-May-2026 10:00  100
      <a href="wikipedia_fr_all_maxi_2026-05.zim">wikipedia_fr_all_maxi_2026-05.zim</a> 29-May-2026 10:00  100
      <a href="wikipedia_de_all_maxi_2026-05.zim">wikipedia_de_all_maxi_2026-05.zim</a> 29-May-2026 10:00  100
    `;
    const entries = service.parseDirectoryListing(html, 'fr');
    expect(entries).toHaveLength(1);
    expect(entries[0].fileName).toBe('wikipedia_fr_all_maxi_2026-05.zim');
  });

  it('parseDirectoryListing correctly populates url and lang fields', () => {
    const html = `
      <a href="wikipedia_es_all_maxi_2026-05.zim">wikipedia_es_all_maxi_2026-05.zim</a> 29-May-2026 10:00  100
    `;
    const entries = service.parseDirectoryListing(html, 'es');
    expect(entries).toHaveLength(1);
    expect(entries[0].lang).toBe('es');
    expect(entries[0].url).toBe(
      'https://download.kiwix.org/zim/wikipedia/wikipedia_es_all_maxi_2026-05.zim',
    );
  });

  it('parseDirectoryListing is safe against regex-special characters in lang', () => {
    const html = `
      <a href="wikipedia_en_all_maxi_2026-05.zim">wikipedia_en_all_maxi_2026-05.zim</a> 29-May-2026 10:00  100
      <a href="wikipedia_fr_all_maxi_2026-05.zim">wikipedia_fr_all_maxi_2026-05.zim</a> 29-May-2026 10:00  100
    `;
    // If regex chars in lang were not escaped, '.*' would match every entry.
    const entries = service.parseDirectoryListing(html, '.*');
    expect(entries).toEqual([]);
  });
});
