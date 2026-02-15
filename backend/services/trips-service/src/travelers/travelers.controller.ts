import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TravelersService } from './travelers.service';
import { KycGuard } from '../common/auth/kyc.guard';

interface LocationUpdate {
  lat: number;
  lon: number;
  country?: string;
  city?: string;
  airportCode?: string;
}

@ApiTags('travelers')
@ApiBearerAuth()
@Controller('api/v1/travelers')
export class TravelersController {
  constructor(private readonly travelersService: TravelersService) {}

  @Post(':travelerId/location')
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Update traveler location' })
  @ApiParam({ name: 'travelerId', description: 'Traveler ID' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  async updateLocation(
    @Req() req: any,
    @Param('travelerId', ParseIntPipe) travelerId: number,
    @Body() location: LocationUpdate,
  ) {
    // Verify that the authenticated user matches the traveler ID
    const authenticatedUserId = req.user?.id;
    if (authenticatedUserId !== travelerId) {
      throw new HttpException('Unauthorized to update this location', HttpStatus.FORBIDDEN);
    }

    if (!location.lat || !location.lon) {
      throw new HttpException('Missing required fields: lat, lon', HttpStatus.BAD_REQUEST);
    }

    return this.travelersService.updateLocation(travelerId, location);
  }

  @Get(':travelerId/location')
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Get traveler location' })
  @ApiParam({ name: 'travelerId', description: 'Traveler ID' })
  @ApiResponse({ status: 200, description: 'Location retrieved successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  async getLocation(
    @Req() req: any,
    @Param('travelerId', ParseIntPipe) travelerId: number,
  ) {
    // Verify that the authenticated user matches the traveler ID
    const authenticatedUserId = req.user?.id;
    if (authenticatedUserId !== travelerId) {
      throw new HttpException('Unauthorized to access this location', HttpStatus.FORBIDDEN);
    }

    return this.travelersService.getLocation(travelerId);
  }

  // Country Layer Integration Endpoints
  
  @Post(':travelerId/routes')
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Add traveler route with country validation' })
  @ApiParam({ name: 'travelerId', description: 'Traveler ID' })
  @ApiResponse({ status: 201, description: 'Route added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid route data or restricted countries' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  async addTravelerRoute(
    @Req() req: any,
    @Param('travelerId') travelerId: string,
    @Body() routeData: {
      originCountry: string;
      destinationCountry: string;
      travelDate: string;
      returnDate?: string;
    },
  ) {
    // Verify that the authenticated user matches the traveler ID
    const authenticatedUserId = req.user?.id;
    if (authenticatedUserId !== travelerId) {
      throw new HttpException('Unauthorized to add route for this traveler', HttpStatus.FORBIDDEN);
    }

    return this.travelersService.addTravelerRoute(travelerId, {
      ...routeData,
      travelDate: new Date(routeData.travelDate),
      returnDate: routeData.returnDate ? new Date(routeData.returnDate) : undefined,
    });
  }

  @Get(':travelerId/routes')
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Get traveler routes' })
  @ApiParam({ name: 'travelerId', description: 'Traveler ID' })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  async getTravelerRoutes(
    @Req() req: any,
    @Param('travelerId') travelerId: string,
  ) {
    // Verify that the authenticated user matches the traveler ID
    const authenticatedUserId = req.user?.id;
    if (authenticatedUserId !== travelerId) {
      throw new HttpException('Unauthorized to access routes for this traveler', HttpStatus.FORBIDDEN);
    }

    return this.travelersService.getTravelerRoutes(travelerId);
  }

  @Get(':travelerId/matching-products')
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Find matching products for traveler routes' })
  @ApiParam({ name: 'travelerId', description: 'Traveler ID' })
  @ApiResponse({ status: 200, description: 'Matching products retrieved successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  async findMatchingProducts(
    @Req() req: any,
    @Param('travelerId') travelerId: string,
    @Body() filters?: {
      productType?: string;
      maxRiskScore?: number;
    },
  ) {
    // Verify that the authenticated user matches the traveler ID
    const authenticatedUserId = req.user?.id;
    if (authenticatedUserId !== travelerId) {
      throw new HttpException('Unauthorized to access matching products for this traveler', HttpStatus.FORBIDDEN);
    }

    return this.travelersService.findMatchingProductsForRoutes(travelerId, filters);
  }

  @Get('countries/active')
  @ApiOperation({ summary: 'Get active countries for travel' })
  @ApiResponse({ status: 200, description: 'Active countries retrieved successfully' })
  async getActiveCountries() {
    return this.travelersService.getActiveCountries();
  }

  @Get('countries/:code')
  @ApiOperation({ summary: 'Get country information' })
  @ApiParam({ name: 'code', description: 'Country ISO code (2-letter)' })
  @ApiResponse({ status: 200, description: 'Country information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async getCountryInfo(@Param('code') code: string) {
    return this.travelersService.getCountryInfo(code.toUpperCase());
  }
}