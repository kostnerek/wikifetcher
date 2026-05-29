import { Test, TestingModule } from '@nestjs/testing';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';

describe('LanguagesController', () => {
  let controller: LanguagesController;
  let service: LanguagesService;

  const mockLanguage = {
    id: 1,
    code: 'en',
    name: 'English',
    withImages: true,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLanguagesService = {
    findAll: jest.fn().mockResolvedValue([mockLanguage]),
    create: jest.fn().mockResolvedValue(mockLanguage),
    update: jest.fn().mockResolvedValue({ ...mockLanguage, enabled: false }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LanguagesController],
      providers: [
        { provide: LanguagesService, useValue: mockLanguagesService },
      ],
    }).compile();

    controller = module.get<LanguagesController>(LanguagesController);
    service = module.get<LanguagesService>(LanguagesService);
  });

  it('GET /api/languages returns all languages', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockLanguage]);
  });

  it('POST /api/languages creates a language', async () => {
    const dto = { code: 'en', name: 'English', withImages: true };
    const result = await controller.create(dto);
    expect(result.code).toBe('en');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('PUT /api/languages/:id updates a language', async () => {
    const result = await controller.update(1, { enabled: false });
    expect(result.enabled).toBe(false);
  });

  it('DELETE /api/languages/:id removes a language', async () => {
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
