import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MenuSuggestRequestDto } from './dto/menu-suggest-request.dto';
import {
  MenuSuggestResponseDto,
  SuggestedMenuDto,
} from './dto/menu-suggest-response.dto';
import { GeminiMenuProvider } from './gemini-menu.provider';
import { WeatherService } from '../weather/weather.service';
import { DIETARY_PREFERENCES } from './preferences.constants';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    private readonly weatherService: WeatherService,
    private readonly geminiMenuProvider: GeminiMenuProvider,
  ) {}

  async suggestMenu(
    cityId: number,
    request: MenuSuggestRequestDto,
  ): Promise<MenuSuggestResponseDto> {
    try {
      this.logger.log(
        `Generating menu suggestion for city ${cityId} on ${request.date}`,
      );
      const resolvedPreferences = this.resolvePreferenceLabels(
        request.preferenceIds,
      );

      const weatherResponse = await this.weatherService.getWeather(cityId, {
        date: request.date,
      });
      const menu = await this.geminiMenuProvider.suggestMenu({
        location: weatherResponse.location.name,
        date: weatherResponse.date,
        preferences: resolvedPreferences,
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
    } catch (error) {
      this.logger.error(
        `Failed to generate menu suggestion for city ${cityId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  private normalizeMenu(menu: SuggestedMenuDto): SuggestedMenuDto {
    return {
      breakfast: menu.breakfast.trim(),
      lunch: menu.lunch.trim(),
      dinner: menu.dinner.trim(),
    };
  }

  private resolvePreferenceLabels(preferenceIds: number[]): string[] {
    if (preferenceIds.length === 0) {
      return [];
    }

    const preferenceLookup = new Map(
      DIETARY_PREFERENCES.map((preference) => [preference.id, preference]),
    );
    const invalidPreferenceIds = preferenceIds.filter(
      (preferenceId) => !preferenceLookup.has(preferenceId),
    );

    if (invalidPreferenceIds.length > 0) {
      throw new BadRequestException(
        `Unsupported dietary preference ids: ${invalidPreferenceIds.join(', ')}`,
      );
    }

    return preferenceIds.map(
      (preferenceId) => preferenceLookup.get(preferenceId)!.promptLabel,
    );
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
