import { Module } from '@nestjs/common';
import { LocationsModule } from '../locations/locations.module';
import { WeatherController } from './weather.controller';
import { OpenMeteoWeatherProvider } from './open-meteo-weather.provider';
import { WeatherService } from './weather.service';

@Module({
  imports: [LocationsModule],
  controllers: [WeatherController],
  providers: [WeatherService, OpenMeteoWeatherProvider],
  exports: [WeatherService],
})
export class WeatherModule {}
