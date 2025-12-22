import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { KycGuard } from '../common/auth/kyc.guard';

const MOCK_TRAVELER_ID = 1;

@ApiTags('trips')
@ApiBearerAuth()
@Controller('api/v1/trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  create(@Req() req: any, @Body() createTripDto: CreateTripDto) {
    const travelerId = req.user?.id;
    if (!travelerId) {
      throw new Error('User not authenticated');
    }
    return this.tripsService.create(travelerId, createTripDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search available trips' })
  @ApiResponse({ status: 200, description: 'Trips retrieved successfully' })
  search(@Query() searchDto: SearchTripsDto) {
    return this.tripsService.search(searchDto);
  }

  @Get('my-trips')
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Get my trips as a traveler' })
  @ApiResponse({ status: 200, description: 'Trips retrieved successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  findMyTrips(@Req() req: any) {
    const travelerId = req.user?.id;
    if (!travelerId) {
      throw new Error('User not authenticated');
    }
    return this.tripsService.findMyTrips(travelerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(KycGuard)
  @ApiOperation({ summary: 'Update trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip updated successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    const travelerId = req.user?.id;
    if (!travelerId) {
      throw new Error('User not authenticated');
    }
    return this.tripsService.update(id, travelerId, updateTripDto);
  }

  @Delete(':id')
  @UseGuards(KycGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip cancelled successfully' })
  @ApiResponse({ status: 403, description: 'KYC verification required' })
  cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const travelerId = req.user?.id;
    if (!travelerId) {
      throw new Error('User not authenticated');
    }
    return this.tripsService.cancel(id, travelerId);
  }
}
