import { Module } from '@nestjs/common';
import { ZimCatalogService } from './zim-catalog.service';
import { ZimCatalogController } from './zim-catalog.controller';

@Module({
  controllers: [ZimCatalogController],
  providers: [ZimCatalogService],
  exports: [ZimCatalogService],
})
export class ZimCatalogModule {}
