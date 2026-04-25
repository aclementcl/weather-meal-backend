import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Location } from '../locations/locations.types';
import {
  OpenMeteoDailyResponse,
  WeatherProviderDailyForecast,
} from './weather.types';

@Injectable()
export class OpenMeteoWeatherProvider {
  private readonly logger = new Logger(OpenMeteoWeatherProvider.name);
  private static readonly DAILY_FIELDS = [
    'weather_code',
    'temperature_2m_min',
    'temperature_2m_max',
  ].join(',');

  constructor(private readonly configService: ConfigService) {}

  async getDailyWeather(
    location: Location,
    date: string,
  ): Promise<WeatherProviderDailyForecast> {
    try {
      const endpoint = this.getEndpointForDate(date);
      const url = new URL(endpoint);

      url.searchParams.set('latitude', String(location.latitude));
      url.searchParams.set('longitude', String(location.longitude));
      url.searchParams.set('daily', OpenMeteoWeatherProvider.DAILY_FIELDS);
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('start_date', date);
      url.searchParams.set('end_date', date);

      this.logger.log(
        `Requesting weather for ${location.name} (${location.latitude}, ${location.longitude}) on ${date}`,
      );

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(
          `Weather provider request failed with status ${response.status}`,
        );
        throw new BadGatewayException('Weather provider request failed');
      }

      const payload = (await response.json()) as OpenMeteoDailyResponse;
      const daily = payload.daily;

      if (
        !daily?.time?.length ||
        !daily.temperature_2m_min?.length ||
        !daily.temperature_2m_max?.length
      ) {
        this.logger.error('Weather provider returned incomplete data');
        throw new BadGatewayException(
          'Weather provider returned incomplete data',
        );
      }

      return {
        temperatureMin: daily.temperature_2m_min[0],
        temperatureMax: daily.temperature_2m_max[0],
        weatherCode: daily.weather_code?.[0],
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Unexpected weather provider error: ${this.getErrorMessage(error)}`,
      );
      throw new BadGatewayException('Weather provider request failed');
    }
  }

  private getEndpointForDate(date: string): string {
    const forecastBaseUrl =
      this.configService.get<string>('WEATHER_API_FORECAST_BASE_URL') ??
      'https://api.open-meteo.com/v1/forecast';
    const archiveBaseUrl =
      this.configService.get<string>('WEATHER_API_ARCHIVE_BASE_URL') ??
      'https://archive-api.open-meteo.com/v1/archive';

    return date < this.getTodayInChile()
      ? archiveBaseUrl
      : forecastBaseUrl;
  }

  private getTodayInChile(): string {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      throw new BadGatewayException('Unable to resolve current Chilean date');
    }

    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
