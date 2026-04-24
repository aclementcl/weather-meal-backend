import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrictIsoDate } from '../../common/validation/is-strict-iso-date.decorator';

export class WeatherQueryDto {
  @ApiProperty({
    example: 'Santiago',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city: string;

  @ApiProperty({
    example: '2026-04-23',
    description: 'ISO 8601 date in yyyy-mm-dd format.',
  })
  @IsString()
  @IsStrictIsoDate()
  date: string;
}
