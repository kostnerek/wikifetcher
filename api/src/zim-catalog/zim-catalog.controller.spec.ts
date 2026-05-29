import { Test, TestingModule } from '@nestjs/testing';
import { ZimCatalogController } from './zim-catalog.controller';
import { ZimCatalogService } from './zim-catalog.service';
import { AvailableQueryDto } from './dto/available-query.dto';

describe('ZimCatalogController', () => {
  let controller: ZimCatalogController;
  let service: { getAvailable: jest.Mock };

  beforeEach(async () => {
    service = { getAvailable: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZimCatalogController],
      providers: [{ provide: ZimCatalogService, useValue: service }],
    }).compile();

    controller = module.get<ZimCatalogController>(ZimCatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates lang to the service', async () => {
    const expected = [
      {
        fileName: 'wikipedia_en_all_maxi_2026-05.zim',
        url: 'https://download.kiwix.org/zim/wikipedia/wikipedia_en_all_maxi_2026-05.zim',
        hasImages: true,
        lang: 'en',
      },
    ];
    service.getAvailable.mockResolvedValue(expected);

    const query: AvailableQueryDto = { lang: 'en' };
    const result = await controller.getAvailable(query);

    expect(service.getAvailable).toHaveBeenCalledWith('en');
    expect(result).toBe(expected);
  });
});
