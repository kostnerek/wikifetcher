import { IsString, IsBoolean, IsOptional, Length } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @Length(2, 10)
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  withImages?: boolean;
}
