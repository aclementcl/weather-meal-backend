import { Injectable } from '@nestjs/common';
import { CHILE_LOCATIONS } from './locations.data';
import { Location } from './locations.types';

@Injectable()
export class LocationsService {
  getChileLocations(): Location[] {
    return CHILE_LOCATIONS;
  }

  findChileLocationByName(city: string): Location | undefined {
    const normalizedCity = this.normalizeCityName(city);

    return CHILE_LOCATIONS.find(
      (location) => this.normalizeCityName(location.name) === normalizedCity,
    );
  }

  private normalizeCityName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
}
