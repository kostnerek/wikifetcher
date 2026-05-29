import { IsOptional, IsString, IsInt, Min, Matches } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Matches(
    /^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/,
    { message: 'Invalid cron expression' },
  )
  cronExpression?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxVersionsToKeep?: number;
}
