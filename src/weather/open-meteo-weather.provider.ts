import { BadGatewayException, Injectable } from '@nestjs/common';
import { Location } from '../locations/locations.types';
import {
  OpenMeteoDailyResponse,
  WeatherProviderDailyForecast,
} from './weather.types';

@Injectable()
export class OpenMeteoWeatherProvider {
  private static readonly DAILY_FIELDS = [
    'weather_code',
    'temperature_2m_min',
    'temperature_2m_max',
  ].join(',');

  async getDailyWeather(
    location: Location,
    date: string,
  ): Promise<WeatherProviderDailyForecast> {
    const endpoint = this.getEndpointForDate(date);
    const url = new URL(endpoint);

    url.searchParams.set('latitude', String(location.latitude));
    url.searchParams.set('longitude', String(location.longitude));
    url.searchParams.set('daily', OpenMeteoWeatherProvider.DAILY_FIELDS);
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('start_date', date);
    url.searchParams.set('end_date', date);

    const response = await fetch(url);

    if (!response.ok) {
      throw new BadGatewayException('Weather provider request failed');
    }

    const payload = (await response.json()) as OpenMeteoDailyResponse;
    const daily = payload.daily;

    if (
      !daily?.time?.length ||
      !daily.temperature_2m_min?.length ||
      !daily.temperature_2m_max?.length
    ) {
      throw new BadGatewayException('Weather provider returned incomplete data');
    }

    return {
      temperatureMin: daily.temperature_2m_min[0],
      temperatureMax: daily.temperature_2m_max[0],
      weatherCode: daily.weather_code?.[0],
    };
  }

  private getEndpointForDate(date: string): string {
    return date < this.getTodayInChile()
      ? 'https://archive-api.open-meteo.com/v1/archive'
      : 'https://api.open-meteo.com/v1/forecast';
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
}
