import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LocationsService } from '../locations/locations.service';
import { WeatherQueryDto } from './dto/weather-query.dto';
import { WeatherResponseDto } from './dto/weather-response.dto';
import { OpenMeteoWeatherProvider } from './open-meteo-weather.provider';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly locationsService: LocationsService,
    private readonly openMeteoWeatherProvider: OpenMeteoWeatherProvider,
  ) {}

  async getWeather(
    cityId: number,
    query: WeatherQueryDto,
  ): Promise<WeatherResponseDto> {
    try {
      const location = this.locationsService.findChileLocationById(cityId);

      if (!location) {
        this.logger.warn(`Unsupported city requested: ${cityId}`);
        throw new NotFoundException(`Unsupported city: ${cityId}`);
      }

      this.logger.log(
        `Resolving weather for city ${location.name} on ${query.date}`,
      );

      const providerWeather = await this.openMeteoWeatherProvider.getDailyWeather(
        location,
        query.date,
      );

      return {
        location,
        date: query.date,
        weather: {
          summary: this.mapWeatherCodeToSummary(providerWeather.weatherCode),
          temperatureMin: providerWeather.temperatureMin,
          temperatureMax: providerWeather.temperatureMax,
          weatherCode: providerWeather.weatherCode,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to resolve weather for city ${cityId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
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

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
