import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { WeatherQueryDto } from './dto/weather-query.dto';
import { WeatherResponseDto } from './dto/weather-response.dto';
import { WeatherService } from './weather.service';

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
  @ApiOkResponse({
    description: 'Normalized weather response for Angular consumption.',
    type: WeatherResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The requested city is not supported by the static catalog.',
  })
  @Get()
  getWeather(@Query() query: WeatherQueryDto): Promise<WeatherResponseDto> {
    return this.weatherService.getWeather(query);
  }
}
