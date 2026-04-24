import { ApiProperty } from '@nestjs/swagger';

export class MenuSuggestRequest {
  @ApiProperty({
    example: 'Santiago',
  })
  location: string;

  @ApiProperty({
    example: '2026-04-23',
    description: 'ISO 8601 date in yyyy-mm-dd format.',
  })
  date: string;

  @ApiProperty({
    example: ['vegetarian', 'gluten-free'],
    type: [String],
  })
  preferences: string[];
}

export class SuggestedMenu {
  @ApiProperty({
    example: 'Avena con fruta y te',
  })
  breakfast: string;

  @ApiProperty({
    example: 'Crema de zapallo con quinoa',
  })
  lunch: string;

  @ApiProperty({
    example: 'Tortilla de verduras y ensalada tibia',
  })
  dinner: string;
}

export class MenuWeatherSummary {
  @ApiProperty({
    example: 'Partly cloudy',
  })
  summary: string;

  @ApiProperty({
    example: 11,
  })
  temperatureMin: number;

  @ApiProperty({
    example: 22,
  })
  temperatureMax: number;
}

export class MenuSuggestResponse {
  @ApiProperty({
    example: 'Santiago',
  })
  location: string;

  @ApiProperty({
    example: '2026-04-23',
  })
  date: string;

  @ApiProperty({
    type: MenuWeatherSummary,
  })
  weather: MenuWeatherSummary;

  @ApiProperty({
    type: SuggestedMenu,
  })
  menu: SuggestedMenu;
}

export interface MenuAiInput {
  location: string;
  date: string;
  preferences: string[];
  weatherSummary: string;
  temperatureMin: number;
  temperatureMax: number;
}

export interface OpenAiResponsesApiResponse {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}
