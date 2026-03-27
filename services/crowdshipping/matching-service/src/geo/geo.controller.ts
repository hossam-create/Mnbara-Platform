import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { NearbySearchDto, UpdateLocationDto, MatchOrderDto } from './dto/geo.dto';

@ApiTags('geo')
@ApiBearerAuth()
@Controller('api/v1/geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('listings/nearby')
  @ApiOperation({ summary: 'Find listings within radius of a point' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lon', type: Number, description: 'Longitude' })
  @ApiQuery({ name: 'radiusKm', type: Number, description: 'Search radius in km', required: false })
  @ApiResponse({ status: 200, description: 'Nearby listings found' })
  async findNearbyListings(@Query() query: NearbySearchDto) {
    const { lat, lon, radiusKm = 50 } = query;
    const listings = await this.geoService.findListingsWithinRadius(
      { lat, lon },
      radiusKm,
    );
    return {
      center: { lat, lon },
      radiusKm,
      count: listings.length,
      listings,
    };
  }

  @Get('travelers/nearby')
  @ApiOperation({ summary: 'Find travelers within radius of a point' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lon', type: Number, description: 'Longitude' })
  @ApiQuery({ name: 'radiusKm', type: Number, description: 'Search radius in km', required: false })
  @ApiResponse({ status: 200, description: 'Nearby travelers found' })
  async findNearbyTravelers(@Query() query: NearbySearchDto) {
    const { lat, lon, radiusKm = 50 } = query;
    const travelers = await this.geoService.findTravelersWithinRadius(
      { lat, lon },
      radiusKm,
    );
    return {
      center: { lat, lon },
      radiusKm,
      count: travelers.length,
      travelers,
    };
  }

  @Get('trips/nearby')
  @ApiOperation({ summary: 'Find trips with origin near a point' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitude' })
  @ApiQuery({ name: 'lon', type: Number, description: 'Longitude' })
  @ApiQuery({ name: 'radiusKm', type: Number, description: 'Search radius in km', required: false })
  @ApiResponse({ status: 200, description: 'Nearby trips found' })
  async findNearbyTrips(@Query() query: NearbySearchDto) {
    const { lat, lon, radiusKm = 50 } = query;
    const trips = await this.geoService.findTripsNearOrigin(
      { lat, lon },
      radiusKm,
    );
    return {
      center: { lat, lon },
      radiusKm,
      count: trips.length,
      trips,
    };
  }

  @Post('match/order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find trips matching an order based on proximity' })
  @ApiResponse({ status: 200, description: 'Matching trips found' })
  async matchOrderWithTrips(@Body() matchDto: MatchOrderDto) {
    const { orderId, maxPickupRadiusKm = 50, maxDeliveryRadiusKm = 50 } = matchDto;
    const matches = await this.geoService.matchOrderWithTrips(
      orderId,
      maxPickupRadiusKm,
      maxDeliveryRadiusKm,
    );
    return {
      orderId,
      searchParams: { maxPickupRadiusKm, maxDeliveryRadiusKm },
      count: matches.length,
      matches,
    };
  }

  @Post('traveler/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update traveler location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateTravelerLocation(@Body() updateDto: UpdateLocationDto) {
    await this.geoService.updateTravelerLocation(
      updateDto.travelerId,
      updateDto.lat,
      updateDto.lon,
      updateDto.country,
      updateDto.airportCode,
    );
    return {
      message: 'Location updated successfully',
      travelerId: updateDto.travelerId,
      location: { lat: updateDto.lat, lon: updateDto.lon },
    };
  }

  @Get('distance')
  @ApiOperation({ summary: 'Calculate distance between two points' })
  @ApiQuery({ name: 'lat1', type: Number })
  @ApiQuery({ name: 'lon1', type: Number })
  @ApiQuery({ name: 'lat2', type: Number })
  @ApiQuery({ name: 'lon2', type: Number })
  @ApiResponse({ status: 200, description: 'Distance calculated' })
  calculateDistance(
    @Query('lat1') lat1: number,
    @Query('lon1') lon1: number,
    @Query('lat2') lat2: number,
    @Query('lon2') lon2: number,
  ) {
    const distanceKm = this.geoService.haversineDistance(lat1, lon1, lat2, lon2);
    return {
      from: { lat: lat1, lon: lon1 },
      to: { lat: lat2, lon: lon2 },
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceMiles: Math.round(distanceKm * 0.621371 * 100) / 100,
    };
  }
}
