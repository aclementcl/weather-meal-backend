import { Injectable } from '@nestjs/common';
import { CHILE_LOCATIONS } from './locations.data';
import { City, Location, Region } from './locations.types';

@Injectable()
export class LocationsService {
  getChileRegions(): Region[] {
    const seenRegions = new Map<string, Region>();

    for (const location of CHILE_LOCATIONS) {
      if (!seenRegions.has(location.regionId)) {
        seenRegions.set(location.regionId, {
          id: location.regionId,
          name: location.regionName,
        });
      }
    }

    return [...seenRegions.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  getChileCities(regionId?: string): City[] {
    const normalizedRegionId = regionId?.trim().toLowerCase();
    const cities = normalizedRegionId
      ? CHILE_LOCATIONS.filter(
          (location) => location.regionId === normalizedRegionId,
        )
      : CHILE_LOCATIONS;

    return [...cities].sort((left, right) => left.name.localeCompare(right.name));
  }

  findChileRegionById(regionId: string): Region | undefined {
    const normalizedRegionId = regionId.trim().toLowerCase();

    return this.getChileRegions().find((region) => region.id === normalizedRegionId);
  }

  findChileLocationByName(city: string): Location | undefined {
    const normalizedCity = this.normalizeCityName(city);

    return CHILE_LOCATIONS.find(
      (location) => this.normalizeCityName(location.name) === normalizedCity,
    );
  }

  findChileLocationById(cityId: string): Location | undefined {
    const normalizedCityId = cityId.trim().toLowerCase();

    return CHILE_LOCATIONS.find((location) => location.id === normalizedCityId);
  }

  private normalizeCityName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
}
