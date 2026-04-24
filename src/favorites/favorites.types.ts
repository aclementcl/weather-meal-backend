import { ApiProperty } from '@nestjs/swagger';
import { MenuSuggestResponse, MenuWeatherSummary, SuggestedMenu } from '../menu/menu.types';

export class FavoriteCreateRequest extends MenuSuggestResponse {}

export class FavoriteItem {
  @ApiProperty({
    example: 'fav_001',
  })
  id: string;

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
