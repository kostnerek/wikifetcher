import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DownloadsService } from './downloads.service';
import { QueryDownloadsDto } from './dto/query-downloads.dto';

@Controller('api/downloads')
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get()
  findAll(@Query() query: QueryDownloadsDto) {
    return this.downloadsService.findAll(query);
  }

  @Post('trigger')
  trigger() {
    return this.downloadsService.triggerDownloads();
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
