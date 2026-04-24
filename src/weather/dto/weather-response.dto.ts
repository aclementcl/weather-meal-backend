import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../../locations/locations.types';

export class NormalizedWeatherDto {
  @ApiProperty({
    example: 'Clear sky',
  })
  summary: string;

  @ApiProperty({
    example: 8.4,
  })
  temperatureMin: number;

  @ApiProperty({
    example: 22.1,
  })
  temperatureMax: number;

  @ApiPropertyOptional({
    example: 0,
  })
  weatherCode?: number;
}

export class WeatherResponseDto {
  @ApiProperty({
    type: Location,
  })
  location: Location;

  @ApiProperty({
    example: '2026-04-23',
  })
  date: string;

  @ApiProperty({
    type: NormalizedWeatherDto,
  })
  weather: NormalizedWeatherDto;
}
