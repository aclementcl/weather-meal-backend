import { Module } from '@nestjs/common';
import { WeatherModule } from '../weather/weather.module';
import { GeminiMenuProvider } from './gemini-menu.provider';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [WeatherModule],
  controllers: [MenuController],
  providers: [MenuService, GeminiMenuProvider],
})
export class MenuModule {}
