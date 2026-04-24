import { Module } from '@nestjs/common';
import { FavoritesModule } from './favorites/favorites.module';
import { LocationsModule } from './locations/locations.module';
import { MenuModule } from './menu/menu.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [LocationsModule, WeatherModule, MenuModule, FavoritesModule],
})
export class AppModule {}
