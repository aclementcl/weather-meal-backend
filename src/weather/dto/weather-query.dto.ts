import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsForecastDate } from '../../common/validation/is-forecast-date.decorator';
import { IsStrictIsoDate } from '../../common/validation/is-strict-iso-date.decorator';

export class WeatherQueryDto {
  @ApiProperty({
    example: '2026-04-23',
    description: 'ISO 8601 date in yyyy-mm-dd format.',
  })
  @IsString()
  @IsStrictIsoDate()
  @IsForecastDate()
  date: string;
}
