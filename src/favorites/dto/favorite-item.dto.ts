import { ApiProperty } from '@nestjs/swagger';
import {
  MenuWeatherSummaryDto,
  SuggestedMenuDto,
} from '../../menu/dto/menu-suggest-response.dto';

export class FavoriteItemDto {
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
    type: MenuWeatherSummaryDto,
  })
  weather: MenuWeatherSummaryDto;

  @ApiProperty({
    type: SuggestedMenuDto,
  })
  menu: SuggestedMenuDto;
}
