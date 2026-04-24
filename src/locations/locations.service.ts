import { Injectable } from '@nestjs/common';
import { CHILE_LOCATIONS } from './locations.data';
import { Location } from './locations.types';

@Injectable()
export class LocationsService {
  getChileLocations(): Location[] {
    return CHILE_LOCATIONS;
  }
}
