import { Injectable, NotFoundException } from '@nestjs/common';
import { FavoriteCreateDto } from './dto/favorite-create.dto';
import { FavoriteItemDto } from './dto/favorite-item.dto';

@Injectable()
export class FavoritesService {
  private favorites: FavoriteItemDto[] = [];

  getFavorites(): FavoriteItemDto[] {
    return this.favorites;
  }

  createFavorite(request: FavoriteCreateDto): FavoriteItemDto {
    const favorite: FavoriteItemDto = {
      id: this.generateId(),
      location: request.location.trim(),
      date: request.date,
      weather: {
        summary: request.weather.summary.trim(),
        temperatureMin: request.weather.temperatureMin,
        temperatureMax: request.weather.temperatureMax,
      },
      menu: {
        breakfast: request.menu.breakfast.trim(),
        lunch: request.menu.lunch.trim(),
        dinner: request.menu.dinner.trim(),
      },
    };

    this.favorites = [favorite, ...this.favorites];

    return favorite;
  }

  deleteFavorite(id: string): void {
    const nextFavorites = this.favorites.filter((favorite) => favorite.id !== id);

    if (nextFavorites.length === this.favorites.length) {
      throw new NotFoundException(`Favorite not found: ${id}`);
    }

    this.favorites = nextFavorites;
  }

  private generateId(): string {
    return `fav_${Math.random().toString(36).slice(2, 10)}`;
  }
}
