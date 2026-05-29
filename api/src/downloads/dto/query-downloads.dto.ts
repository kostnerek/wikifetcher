import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { DownloadStatus } from '../downloads.entity';

export class QueryDownloadsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  languageId?: number;

  @IsOptional()
  @IsEnum(DownloadStatus)
  status?: DownloadStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
