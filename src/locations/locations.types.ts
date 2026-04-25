import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class Region {
  @ApiProperty({
    example: 'metropolitana-de-santiago',
  })
  id: string;

  @ApiProperty({
    example: 'Metropolitana de Santiago',
  })
  name: string;
}

export class City {
  @ApiProperty({
    example: 'santiago',
  })
  id: string;

  @ApiProperty({
    example: 'Santiago',
  })
  name: string;

  @ApiProperty({
    example: 'metropolitana-de-santiago',
  })
  regionId: string;

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

export class CitiesQueryDto {
  @ApiPropertyOptional({
    example: 'metropolitana-de-santiago',
    description: 'Optional region identifier returned by /regions.',
  })
  @IsOptional()
  @IsString()
  regionId?: string;
}
