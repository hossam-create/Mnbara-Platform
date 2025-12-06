import { Controller, Get, Param, Query } from '@nestjs/common';
import { FlightsService } from './flights.service';

@Controller('flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Get()
  async getAllFlights(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.flightsService.getAllFlights({ status, page, limit });
  }

  @Get('active')
  async getActiveFlights() {
    return this.flightsService.getActiveFlights();
  }

  @Get(':id')
  async getFlightById(@Param('id') id: string) {
    return this.flightsService.getFlightById(parseInt(id));
  }

  @Get('trip/:tripId')
  async getFlightsByTrip(@Param('tripId') tripId: string) {
    return this.flightsService.getFlightsByTrip(parseInt(tripId));
  }
}
