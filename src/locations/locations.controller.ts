import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { City, Region } from './locations.types';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller({
  path: 'locations',
  version: '1',
})
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @ApiOperation({
    summary: 'List supported Chilean regions',
  })
  @ApiOkResponse({
    description: 'Supported Chilean regions for the region selector.',
    type: Region,
    isArray: true,
  })
  @Get('chile/regions')
  getChileRegions(): Region[] {
    return this.locationsService.getChileRegions();
  }

  @ApiOperation({
    summary: 'List supported Chilean cities for a region',
  })
  @ApiOkResponse({
    description: 'Supported Chilean cities for the city selector.',
    type: City,
    isArray: true,
  })
  @Get('chile/regions/:regionId/cities')
  getChileCities(@Param('regionId') regionId: string): City[] {
    const region = this.locationsService.findChileRegionById(regionId);

    if (!region) {
      throw new NotFoundException(`Unsupported region: ${regionId}`);
    }

    return this.locationsService.getChileCities(region.id);
  }
}
