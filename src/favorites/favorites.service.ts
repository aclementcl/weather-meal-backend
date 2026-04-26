import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteCreateDto } from './dto/favorite-create.dto';
import { FavoriteItemDto } from './dto/favorite-item.dto';
import { FavoriteEntity } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
  ) {}

  async getFavorites(): Promise<FavoriteItemDto[]> {
    try {
      const favorites = await this.favoriteRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });

      this.logger.log(`Listing ${favorites.length} favorites`);
      return favorites.map((favorite) => this.toFavoriteItemDto(favorite));
    } catch (error) {
      this.logger.error(
        `Failed to list favorites: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  async createFavorite(request: FavoriteCreateDto): Promise<FavoriteItemDto> {
    try {
      const favorite = this.favoriteRepository.create({
        location: request.location.trim(),
        date: request.date,
        weatherSummary: request.weather.summary.trim(),
        temperatureMin: request.weather.temperatureMin,
        temperatureMax: request.weather.temperatureMax,
        breakfast: request.menu.breakfast.trim(),
        lunch: request.menu.lunch.trim(),
        dinner: request.menu.dinner.trim(),
      });
      const savedFavorite = await this.favoriteRepository.save(favorite);

      this.logger.log(
        `Created favorite ${savedFavorite.id} for ${savedFavorite.location}`,
      );

      return this.toFavoriteItemDto(savedFavorite);
    } catch (error) {
      this.logger.error(
        `Failed to create favorite: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  async deleteFavorite(id: number): Promise<void> {
    try {
      const deleteResult = await this.favoriteRepository.delete(id);

      if (!deleteResult.affected) {
        this.logger.warn(`Favorite not found for deletion: ${id}`);
        throw new NotFoundException(`Favorite not found: ${id}`);
      }

      this.logger.log(`Deleted favorite ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete favorite ${id}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  private toFavoriteItemDto(favorite: FavoriteEntity): FavoriteItemDto {
    return {
      id: favorite.id,
      location: favorite.location,
      date: favorite.date,
      weather: {
        summary: favorite.weatherSummary,
        temperatureMin: favorite.temperatureMin,
        temperatureMax: favorite.temperatureMax,
      },
      menu: {
        breakfast: favorite.breakfast,
        lunch: favorite.lunch,
        dinner: favorite.dinner,
      },
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
