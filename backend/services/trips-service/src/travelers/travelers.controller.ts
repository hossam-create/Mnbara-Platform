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
}