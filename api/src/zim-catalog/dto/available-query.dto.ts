import { IsString, Matches } from 'class-validator';

export class AvailableQueryDto {
  @IsString()
  @Matches(/^[a-z]{2,10}$/i, {
    message: 'lang must be 2-10 alphabetic characters',
  })
  lang!: string;
}
