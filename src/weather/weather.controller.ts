import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { WeatherResponse } from './weather.types';

@ApiTags('weather')
@Controller({
  path: 'weather',
  version: '1',
})
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @ApiOperation({
    summary: 'Get normalized weather for a supported Chilean city',
  })
  @ApiQuery({
    name: 'city',
    required: true,
    example: 'Santiago',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-04-23',
  })
  @ApiOkResponse({
    description: 'Normalized weather response for Angular consumption.',
    type: WeatherResponse,
  })
  @ApiNotFoundResponse({
    description: 'The requested city is not supported by the static catalog.',
  })
  @Get()
  getWeather(
    @Query('city') city: string,
    @Query('date') date: string,
  ): Promise<WeatherResponse> {
    return this.weatherService.getWeather(city, date);
  }
}
