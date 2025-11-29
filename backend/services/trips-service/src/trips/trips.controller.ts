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

const MOCK_TRAVELER_ID = 1;

@ApiTags('trips')
@ApiBearerAuth()
@Controller('api/v1/trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(MOCK_TRAVELER_ID, createTripDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search available trips' })
  @ApiResponse({ status: 200, description: 'Trips retrieved successfully' })
  search(@Query() searchDto: SearchTripsDto) {
    return this.tripsService.search(searchDto);
  }

  @Get('my-trips')
  @ApiOperation({ summary: 'Get my trips as a traveler' })
  @ApiResponse({ status: 200, description: 'Trips retrieved successfully' })
  findMyTrips() {
    return this.tripsService.findMyTrips(MOCK_TRAVELER_ID);
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
  @ApiOperation({ summary: 'Update trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    return this.tripsService.update(id, MOCK_TRAVELER_ID, updateTripDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip cancelled successfully' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.cancel(id, MOCK_TRAVELER_ID);
  }
}
