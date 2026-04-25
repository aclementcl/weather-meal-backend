import { ApiProperty } from '@nestjs/swagger';

export class Region {
  @ApiProperty({
    example: 7,
  })
  id: number;

  @ApiProperty({
    example: 'Metropolitana de Santiago',
  })
  name: string;
}

export class City {
  @ApiProperty({
    example: 13,
  })
  id: number;

  @ApiProperty({
    example: 'Santiago',
  })
  name: string;

  @ApiProperty({
    example: 7,
  })
  regionId: number;

  @ApiProperty({
    example: 'Metropolitana de Santiago',
  })
  regionName: string;

  @ApiProperty({
    example: -33.4489,
  })
  latitude: number;

  @ApiProperty({
    example: -70.6693,
  })
  longitude: number;
}

export class Location extends City {}
