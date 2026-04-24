import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FavoriteCreateRequest, FavoriteItem } from './favorites.types';

@Injectable()
export class FavoritesService {
  private favorites: FavoriteItem[] = [];

  getFavorites(): FavoriteItem[] {
    return this.favorites;
  }

  createFavorite(request: FavoriteCreateRequest): FavoriteItem {
    this.validateFavoriteRequest(request);

    const favorite: FavoriteItem = {
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

  private validateFavoriteRequest(request: FavoriteCreateRequest): void {
    if (!request || typeof request !== 'object') {
      throw new BadRequestException('Request body is required');
    }

    if (!request.location?.trim()) {
      throw new BadRequestException('Body field "location" is required');
    }

    if (!this.isValidIsoDate(request.date)) {
      throw new BadRequestException(
        'Body field "date" must use yyyy-mm-dd format',
      );
    }

    if (!request.weather || typeof request.weather !== 'object') {
      throw new BadRequestException('Body field "weather" is required');
    }

    if (!request.weather.summary?.trim()) {
      throw new BadRequestException('Body field "weather.summary" is required');
    }

    if (typeof request.weather.temperatureMin !== 'number') {
      throw new BadRequestException(
        'Body field "weather.temperatureMin" must be a number',
      );
    }

    if (typeof request.weather.temperatureMax !== 'number') {
      throw new BadRequestException(
        'Body field "weather.temperatureMax" must be a number',
      );
    }

    if (!request.menu || typeof request.menu !== 'object') {
      throw new BadRequestException('Body field "menu" is required');
    }

    if (!request.menu.breakfast?.trim()) {
      throw new BadRequestException('Body field "menu.breakfast" is required');
    }

    if (!request.menu.lunch?.trim()) {
      throw new BadRequestException('Body field "menu.lunch" is required');
    }

    if (!request.menu.dinner?.trim()) {
      throw new BadRequestException('Body field "menu.dinner" is required');
    }
  }

  private isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }

  private generateId(): string {
    return `fav_${Math.random().toString(36).slice(2, 10)}`;
  }
}
