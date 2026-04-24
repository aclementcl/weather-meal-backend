import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Location {
  @ApiProperty({
    example: 'Santiago',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Metropolitana de Santiago',
  })
  region?: string;

  @ApiProperty({
    example: -33.4489,
  })
  latitude: number;

  @ApiProperty({
    example: -70.6693,
  })
  longitude: number;
}
