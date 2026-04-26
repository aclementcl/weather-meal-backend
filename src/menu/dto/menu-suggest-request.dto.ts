import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
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
    example: [1, 2],
    description:
      'Stable dietary preference identifiers selected in the frontend.',
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Transform(({ value }) =>
    value === undefined
      ? []
      : Array.isArray(value)
      ? value.map((item) =>
          typeof item === 'string' && item.trim().length > 0
            ? Number(item)
            : item,
        )
      : value,
  )
  preferenceIds: number[] = [];
}
