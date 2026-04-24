import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Location } from './locations.types';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller({
  path: 'locations',
  version: '1',
})
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @ApiOperation({
    summary: 'List supported Chilean cities',
  })
  // @ApiOkResponse({
  //   description: 'Supported Chilean locations for the city selector.',
  //   type: Location,
  //   isArray: true,
  // })
  @Get('chile')
  getChileLocations(): Location[] {
    return this.locationsService.getChileLocations();
  }
}
