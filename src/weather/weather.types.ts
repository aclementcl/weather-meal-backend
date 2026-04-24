import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../locations/locations.types';

export class WeatherQueryDto {
  @ApiProperty({
    example: 'Santiago',
  })
  city: string;

  @ApiProperty({
    example: '2026-04-23',
    description: 'ISO 8601 date in yyyy-mm-dd format.',
  })
  date: string;
}

export class NormalizedWeather {
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

export class WeatherResponse {
  @ApiProperty({
    type: Location,
  })
  location: Location;

  @ApiProperty({
    example: '2026-04-23',
  })
  date: string;

  @ApiProperty({
    type: NormalizedWeather,
  })
  weather: NormalizedWeather;
}

export interface WeatherProviderDailyForecast {
  temperatureMin: number;
  temperatureMax: number;
  weatherCode?: number;
}

export interface OpenMeteoDailyResponse {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
  };
}
