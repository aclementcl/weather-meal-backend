import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { IsStrictIsoDate } from '../../common/validation/is-strict-iso-date.decorator';

export class MenuSuggestRequestDto {
  @ApiProperty({
    example: 'Santiago',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location: string;

  @ApiProperty({
    example: '2026-04-23',
    description: 'ISO 8601 date in yyyy-mm-dd format.',
  })
  @IsString()
  @IsStrictIsoDate()
  date: string;

  @ApiProperty({
    example: ['vegetarian', 'gluten-free'],
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => (typeof item === 'string' ? item.trim() : item))
      : value,
  )
  preferences: string[];
}
