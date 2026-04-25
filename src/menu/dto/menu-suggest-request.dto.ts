import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsForecastDate } from '../../common/validation/is-forecast-date.decorator';
import { IsStrictIsoDate } from '../../common/validation/is-strict-iso-date.decorator';

export class MenuSuggestRequestDto {
  @ApiProperty({
    example: '2026-04-23',
    description: 'ISO 8601 date in yyyy-mm-dd format.',
  })
  @IsString()
  @IsStrictIsoDate()
  @IsForecastDate()
  date: string;

  @ApiProperty({
    example: ['vegetarian', 'gluten-free'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) =>
    value === undefined
      ? []
      : Array.isArray(value)
      ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
      : value,
  )
  preferences: string[] = [];
}
