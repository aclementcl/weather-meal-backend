import { Module } from '@nestjs/common';
import { LocationsModule } from './locations/locations.module';
import { MenuModule } from './menu/menu.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [LocationsModule, WeatherModule, MenuModule],
})
export class AppModule {}
