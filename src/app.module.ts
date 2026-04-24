import { Module } from '@nestjs/common';
import { LocationsModule } from './locations/locations.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [LocationsModule, WeatherModule],
})
export class AppModule {}
