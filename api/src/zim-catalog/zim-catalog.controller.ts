import { Controller, Get, Query } from '@nestjs/common';
import { ZimCatalogService } from './zim-catalog.service';

@Controller('api/zim')
export class ZimCatalogController {
  constructor(private readonly zimCatalogService: ZimCatalogService) {}

  @Get('available')
  getAvailable(@Query('lang') lang: string) {
    return this.zimCatalogService.getAvailable(lang);
  }
}
