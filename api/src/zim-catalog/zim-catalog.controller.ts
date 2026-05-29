import { Controller, Get, Query } from '@nestjs/common';
import { ZimCatalogService } from './zim-catalog.service';
import { AvailableQueryDto } from './dto/available-query.dto';

@Controller('api/zim')
export class ZimCatalogController {
  constructor(private readonly zimCatalogService: ZimCatalogService) {}

  @Get('available')
  getAvailable(@Query() query: AvailableQueryDto) {
    return this.zimCatalogService.getAvailable(query.lang);
  }

  @Get('languages')
  getLanguages() {
    return this.zimCatalogService.getLanguages();
  }
}
