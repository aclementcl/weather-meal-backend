import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FavoriteCreateDto } from './dto/favorite-create.dto';
import { FavoriteItemDto } from './dto/favorite-item.dto';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);
  private favorites: FavoriteItemDto[] = [];
  private nextId = 1;

  getFavorites(): FavoriteItemDto[] {
    try {
      this.logger.log(`Listing ${this.favorites.length} favorites`);
      return this.favorites;
    } catch (error) {
      this.logger.error(
        `Failed to list favorites: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  createFavorite(request: FavoriteCreateDto): FavoriteItemDto {
    try {
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
      this.logger.log(`Created favorite ${favorite.id} for ${favorite.location}`);

      return favorite;
    } catch (error) {
      this.logger.error(
        `Failed to create favorite: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  deleteFavorite(id: number): void {
    try {
      const nextFavorites = this.favorites.filter(
        (favorite) => favorite.id !== id,
      );

      if (nextFavorites.length === this.favorites.length) {
        this.logger.warn(`Favorite not found for deletion: ${id}`);
        throw new NotFoundException(`Favorite not found: ${id}`);
      }

      this.favorites = nextFavorites;
      this.logger.log(`Deleted favorite ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete favorite ${id}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  private generateId(): number {
    return this.nextId++;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
