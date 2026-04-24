import { Module } from '@nestjs/common';
import { WeatherModule } from '../weather/weather.module';
import { MenuController } from './menu.controller';
import { OpenAiMenuProvider } from './openai-menu.provider';
import { MenuService } from './menu.service';

@Module({
  imports: [WeatherModule],
  controllers: [MenuController],
  providers: [MenuService, OpenAiMenuProvider],
})
export class MenuModule {}
