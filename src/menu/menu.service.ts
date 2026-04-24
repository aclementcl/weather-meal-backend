import { BadRequestException, Injectable } from '@nestjs/common';
import { WeatherService } from '../weather/weather.service';
import { OpenAiMenuProvider } from './openai-menu.provider';
import {
  MenuSuggestRequest,
  MenuSuggestResponse,
  SuggestedMenu,
} from './menu.types';

@Injectable()
export class MenuService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly openAiMenuProvider: OpenAiMenuProvider,
  ) {}

  async suggestMenu(request: MenuSuggestRequest): Promise<MenuSuggestResponse> {
    const location = request.location?.trim();

    if (!location) {
      throw new BadRequestException('Body field "location" is required');
    }

    if (!Array.isArray(request.preferences)) {
      throw new BadRequestException(
        'Body field "preferences" must be an array of strings',
      );
    }

    const preferences = this.normalizePreferences(request.preferences);
    const weatherResponse = await this.weatherService.getWeather(
      location,
      request.date,
    );
    const menu = await this.openAiMenuProvider.suggestMenu({
      location: weatherResponse.location.name,
      date: weatherResponse.date,
      preferences,
      weatherSummary: weatherResponse.weather.summary,
      temperatureMin: weatherResponse.weather.temperatureMin,
      temperatureMax: weatherResponse.weather.temperatureMax,
    });

    return {
      location: weatherResponse.location.name,
      date: weatherResponse.date,
      weather: {
        summary: weatherResponse.weather.summary,
        temperatureMin: weatherResponse.weather.temperatureMin,
        temperatureMax: weatherResponse.weather.temperatureMax,
      },
      menu: this.normalizeMenu(menu),
    };
  }

  private normalizePreferences(preferences: string[]): string[] {
    const normalized = preferences
      .filter((preference) => typeof preference === 'string')
      .map((preference) => preference.trim())
      .filter(Boolean);

    if (normalized.length !== preferences.length) {
      throw new BadRequestException(
        'Body field "preferences" must only contain non-empty strings',
      );
    }

    return [...new Set(normalized)];
  }

  private normalizeMenu(menu: SuggestedMenu): SuggestedMenu {
    return {
      breakfast: menu.breakfast.trim(),
      lunch: menu.lunch.trim(),
      dinner: menu.dinner.trim(),
    };
  }
}
