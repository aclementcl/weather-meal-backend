import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getCurrentChileIsoDate } from '../common/date/chile-date.util';
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
      const today = this.getTodayInChile();
      const dayOffset = this.getDayOffset(today, date);
      const url = new URL(this.getForecastBaseUrl());

      url.searchParams.set('latitude', String(location.latitude));
      url.searchParams.set('longitude', String(location.longitude));
      url.searchParams.set('daily', OpenMeteoWeatherProvider.DAILY_FIELDS);
      url.searchParams.set('timezone', 'auto');
      url.searchParams.set('forecast_days', String(dayOffset + 1));

      this.logger.log(
        `Requesting weather for ${location.name} (${location.latitude}, ${location.longitude}) on ${date} with forecast_days=${dayOffset + 1}`,
      );

      const response = await fetch(url);

      if (!response.ok) {
        const providerError = await this.safeReadResponseBody(response);
        this.logger.error(
          `Weather provider request failed with status ${response.status}${providerError ? `: ${providerError}` : ''}`,
        );
        throw new BadGatewayException('Weather provider request failed');
      }

      const payload = (await response.json()) as OpenMeteoDailyResponse;
      const daily = payload.daily;
      const targetIndex = daily?.time?.findIndex((currentDate) => currentDate === date);

      if (
        !daily?.time?.length ||
        !daily.temperature_2m_min?.length ||
        !daily.temperature_2m_max?.length ||
        targetIndex === undefined ||
        targetIndex < 0
      ) {
        this.logger.error('Weather provider returned incomplete data');
        throw new BadGatewayException(
          'Weather provider returned incomplete data',
        );
      }

      return {
        temperatureMin: daily.temperature_2m_min[targetIndex],
        temperatureMax: daily.temperature_2m_max[targetIndex],
        weatherCode: daily.weather_code?.[targetIndex],
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

  private getForecastBaseUrl(): string {
    return (
      this.configService.get<string>('WEATHER_API_FORECAST_BASE_URL') ??
      'https://api.open-meteo.com/v1/forecast'
    );
  }

  private getTodayInChile(): string {
    try {
      return getCurrentChileIsoDate();
    } catch {
      throw new BadGatewayException('Unable to resolve current Chilean date');
    }
  }

  private getDayOffset(today: string, targetDate: string): number {
    const todayUtc = new Date(`${today}T00:00:00Z`);
    const targetUtc = new Date(`${targetDate}T00:00:00Z`);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.round((targetUtc.getTime() - todayUtc.getTime()) / millisecondsPerDay);
  }

  private async safeReadResponseBody(response: Response): Promise<string | undefined> {
    try {
      const responseBody = await response.text();
      const trimmedBody = responseBody.trim();

      if (!trimmedBody) {
        return undefined;
      }

      return trimmedBody.length > 300
        ? `${trimmedBody.slice(0, 300)}...`
        : trimmedBody;
    } catch {
      return undefined;
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
