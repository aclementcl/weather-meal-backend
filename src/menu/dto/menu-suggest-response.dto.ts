import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IsStrictIsoDate } from '../../common/validation/is-strict-iso-date.decorator';

export class SuggestedMenuDto {
  @ApiProperty({
    example: 'Avena con fruta y te',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  breakfast: string;

  @ApiProperty({
    example: 'Crema de zapallo con quinoa',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lunch: string;

  @ApiProperty({
    example: 'Tortilla de verduras y ensalada tibia',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  dinner: string;
}

export class MenuWeatherSummaryDto {
  @ApiProperty({
    example: 'Partly cloudy',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  summary: string;

  @ApiProperty({
    example: 11,
  })
  @IsNumber()
  temperatureMin: number;

  @ApiProperty({
    example: 22,
  })
  @IsNumber()
  temperatureMax: number;
}

export class MenuSuggestResponseDto {
  @ApiProperty({
    example: 'Santiago',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  location: string;

  @ApiProperty({
    example: '2026-04-23',
  })
  @IsString()
  @IsStrictIsoDate()
  date: string;

  @ApiProperty({
    type: MenuWeatherSummaryDto,
  })
  @ValidateNested()
  @Type(() => MenuWeatherSummaryDto)
  weather: MenuWeatherSummaryDto;

  @ApiProperty({
    type: SuggestedMenuDto,
  })
  @ValidateNested()
  @Type(() => SuggestedMenuDto)
  menu: SuggestedMenuDto;
}
