import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { QueryDownloadsDto } from './dto/query-downloads.dto';

@Controller('api/downloads')
export class DownloadsController {
  private readonly logger = new Logger(DownloadsController.name);

  constructor(private readonly downloadsService: DownloadsService) {}

  @Get()
  findAll(@Query() query: QueryDownloadsDto) {
    return this.downloadsService.findAll(query);
  }

  @Post('trigger')
  @HttpCode(202)
  trigger() {
    this.downloadsService.triggerDownloads().catch((err) => {
      this.logger.error(`triggerDownloads failed: ${(err as Error).message}`);
    });
  }

  @Post(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.downloadsService.activate(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.downloadsService.remove(id);
  }
}
