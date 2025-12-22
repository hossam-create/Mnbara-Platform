import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { FindTravelersDto } from './dto/find-travelers.dto';
import { MatchRequestDto } from './dto/match-request.dto';

const MOCK_BUYER_ID = 1;
const MOCK_TRAVELER_ID = 2;

@ApiTags('matching')
@ApiBearerAuth()
@Controller('api/v1/matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('find-travelers')
  @ApiOperation({ summary: 'Find compatible travelers for an order' })
  @ApiResponse({ status: 200, description: 'Compatible travelers found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findTravelers(@Query() findDto: FindTravelersDto) {
    return this.matchingService.findCompatibleTravelers(findDto);
  }

  @Post('request-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a match between order and trip' })
  @ApiResponse({ status: 200, description: 'Match requested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  requestMatch(@Body() matchDto: MatchRequestDto, @Headers('x-user-id') userId: string) {
    // Fallback to mock if header missing (for dev)
    const buyerId = userId ? parseInt(userId, 10) : MOCK_BUYER_ID;
    return this.matchingService.requestMatch(matchDto, buyerId);
  }

  @Post('accept-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Traveler accepts a match' })
  @ApiResponse({ status: 200, description: 'Match accepted' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  acceptMatch(@Body() matchDto: MatchRequestDto, @Headers('x-user-id') userId: string) {
    const travelerId = userId ? parseInt(userId, 10) : MOCK_TRAVELER_ID;
    return this.matchingService.acceptMatch(matchDto, travelerId);
  }

  @Post('reject-match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Traveler rejects a match' })
  @ApiResponse({ status: 200, description: 'Match rejected' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  rejectMatch(@Body() matchDto: MatchRequestDto, @Headers('x-user-id') userId: string) {
    const travelerId = userId ? parseInt(userId, 10) : MOCK_TRAVELER_ID;
    return this.matchingService.rejectMatch(matchDto, travelerId);
  }
}
