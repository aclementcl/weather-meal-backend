import { Injectable } from '@nestjs/common';
import { MenuSuggestRequestDto } from './dto/menu-suggest-request.dto';
import {
  MenuSuggestResponseDto,
  SuggestedMenuDto,
} from './dto/menu-suggest-response.dto';
import { WeatherService } from '../weather/weather.service';
import { OpenAiMenuProvider } from './openai-menu.provider';

@Injectable()
export class MenuService {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly openAiMenuProvider: OpenAiMenuProvider,
  ) {}

  async suggestMenu(
    cityId: string,
    request: MenuSuggestRequestDto,
  ): Promise<MenuSuggestResponseDto> {
    const weatherResponse = await this.weatherService.getWeather(
      cityId,
      {
        date: request.date,
      },
    );
    const menu = await this.openAiMenuProvider.suggestMenu({
      location: weatherResponse.location.name,
      date: weatherResponse.date,
      preferences: request.preferences,
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

  private normalizeMenu(menu: SuggestedMenuDto): SuggestedMenuDto {
    return {
      breakfast: menu.breakfast.trim(),
      lunch: menu.lunch.trim(),
      dinner: menu.dinner.trim(),
    };
  }
}
