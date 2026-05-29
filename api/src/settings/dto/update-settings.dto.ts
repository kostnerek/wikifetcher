import { IsOptional, IsString, IsInt, Min, Matches } from 'class-validator';

const CRON_FIELD = `(\\*(\\/\\d+)?|\\d+(-\\d+)?(\\/\\d+)?(,\\d+(-\\d+)?(\\/\\d+)?)*)`;
const CRON_REGEX = new RegExp(
  `^${CRON_FIELD}\\s+${CRON_FIELD}\\s+${CRON_FIELD}\\s+${CRON_FIELD}\\s+${CRON_FIELD}$`,
);

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Matches(CRON_REGEX, { message: 'Invalid cron expression' })
  cronExpression?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxVersionsToKeep?: number;
}
