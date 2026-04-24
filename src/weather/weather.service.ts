import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LocationsService } from '../locations/locations.service';
import { OpenMeteoWeatherProvider } from './open-meteo-weather.provider';
import { WeatherResponse } from './weather.types';

@Injectable()
export class WeatherService {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly openMeteoWeatherProvider: OpenMeteoWeatherProvider,
  ) {}

  async getWeather(city: string, date: string): Promise<WeatherResponse> {
    if (!city?.trim()) {
      throw new BadRequestException('Query param "city" is required');
    }

    if (!this.isValidIsoDate(date)) {
      throw new BadRequestException(
        'Query param "date" must use yyyy-mm-dd format',
      );
    }

    const location = this.locationsService.findChileLocationByName(city);

    if (!location) {
      throw new NotFoundException(`Unsupported city: ${city}`);
    }

    const providerWeather = await this.openMeteoWeatherProvider.getDailyWeather(
      location,
      date,
    );

    return {
      location,
      date,
      weather: {
        summary: this.mapWeatherCodeToSummary(providerWeather.weatherCode),
        temperatureMin: providerWeather.temperatureMin,
        temperatureMax: providerWeather.temperatureMax,
        weatherCode: providerWeather.weatherCode,
      },
    };
  }

  private isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }

  private mapWeatherCodeToSummary(weatherCode?: number): string {
    if (weatherCode === undefined) {
      return 'Unknown';
    }

    if (weatherCode === 0) {
      return 'Clear sky';
    }

    if ([1, 2, 3].includes(weatherCode)) {
      return 'Partly cloudy';
    }

    if ([45, 48].includes(weatherCode)) {
      return 'Fog';
    }

    if ([51, 53, 55].includes(weatherCode)) {
      return 'Drizzle';
    }

    if ([56, 57].includes(weatherCode)) {
      return 'Freezing drizzle';
    }

    if ([61, 63, 65].includes(weatherCode)) {
      return 'Rain';
    }

    if ([66, 67].includes(weatherCode)) {
      return 'Freezing rain';
    }

    if ([71, 73, 75, 77].includes(weatherCode)) {
      return 'Snow';
    }

    if ([80, 81, 82].includes(weatherCode)) {
      return 'Rain showers';
    }

    if ([85, 86].includes(weatherCode)) {
      return 'Snow showers';
    }

    if (weatherCode === 95) {
      return 'Thunderstorm';
    }

    if ([96, 99].includes(weatherCode)) {
      return 'Thunderstorm with hail';
    }

    return 'Unknown';
  }
}
