import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLanguageDto {
  @IsOptional()
  @IsBoolean()
  withImages?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
