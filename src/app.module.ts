import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FavoritesModule } from './favorites/favorites.module';
import { LocationsModule } from './locations/locations.module';
import { MenuModule } from './menu/menu.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    LocationsModule,
    WeatherModule,
    MenuModule,
    FavoritesModule,
  ],
})
export class AppModule {}
