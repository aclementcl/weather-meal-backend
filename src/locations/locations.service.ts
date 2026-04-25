import { Injectable, Logger } from '@nestjs/common';
import { CHILE_LOCATIONS } from './locations.data';
import { City, Location, Region } from './locations.types';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  getChileRegions(): Region[] {
    try {
      const seenRegions = new Map<number, Region>();

      for (const location of CHILE_LOCATIONS) {
        if (!seenRegions.has(location.regionId)) {
          seenRegions.set(location.regionId, {
            id: location.regionId,
            name: location.regionName,
          });
        }
      }

      const regions = [...seenRegions.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      this.logger.log(`Resolved ${regions.length} supported regions`);

      return regions;
    } catch (error) {
      this.logger.error(
        `Failed to resolve supported regions: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  getChileCities(regionId?: number): City[] {
    try {
      const cities = regionId !== undefined
        ? CHILE_LOCATIONS.filter(
            (location) => location.regionId === regionId,
          )
        : CHILE_LOCATIONS;
      const sortedCities = [...cities].sort((left, right) =>
        left.name.localeCompare(right.name),
      );

      this.logger.log(
        regionId !== undefined
          ? `Resolved ${sortedCities.length} cities for region ${regionId}`
          : `Resolved ${sortedCities.length} cities without region filter`,
      );

      return sortedCities;
    } catch (error) {
      this.logger.error(
        `Failed to resolve cities: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  findChileRegionById(regionId: number): Region | undefined {
    try {
      const region = this.getChileRegions().find(
        (candidate) => candidate.id === regionId,
      );

      this.logger.log(
        region
          ? `Resolved region ${regionId}`
          : `Region not found: ${regionId}`,
      );

      return region;
    } catch (error) {
      this.logger.error(
        `Failed to resolve region ${regionId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  findChileLocationByName(city: string): Location | undefined {
    try {
      const normalizedCity = this.normalizeCityName(city);
      const location = CHILE_LOCATIONS.find(
        (candidate) => this.normalizeCityName(candidate.name) === normalizedCity,
      );

      this.logger.log(
        location
          ? `Resolved city by name ${normalizedCity}`
          : `City not found by name: ${normalizedCity}`,
      );

      return location;
    } catch (error) {
      this.logger.error(
        `Failed to resolve city by name ${city}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  findChileLocationById(cityId: number): Location | undefined {
    try {
      const location = CHILE_LOCATIONS.find(
        (candidate) => candidate.id === cityId,
      );

      this.logger.log(
        location
          ? `Resolved city ${cityId}`
          : `City not found: ${cityId}`,
      );

      return location;
    } catch (error) {
      this.logger.error(
        `Failed to resolve city ${cityId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  private normalizeCityName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
