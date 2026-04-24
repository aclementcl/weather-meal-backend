import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FavoriteCreateRequest, FavoriteItem } from './favorites.types';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@Controller({
  path: 'favorites',
  version: '1',
})
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiOperation({
    summary: 'List saved favorite menu suggestions',
  })
  @ApiOkResponse({
    description: 'Saved favorite menu suggestions.',
    type: FavoriteItem,
    isArray: true,
  })
  @Get()
  getFavorites(): FavoriteItem[] {
    return this.favoritesService.getFavorites();
  }

  @ApiOperation({
    summary: 'Save a favorite menu suggestion',
  })
  @ApiCreatedResponse({
    description: 'Favorite menu suggestion saved successfully.',
    type: FavoriteItem,
  })
  @Post()
  createFavorite(@Body() request: FavoriteCreateRequest): FavoriteItem {
    return this.favoritesService.createFavorite(request);
  }

  @ApiOperation({
    summary: 'Delete a favorite menu suggestion',
  })
  @ApiNoContentResponse({
    description: 'Favorite menu suggestion deleted successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Favorite menu suggestion was not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteFavorite(@Param('id') id: string): void {
    this.favoritesService.deleteFavorite(id);
  }
}
