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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';

// TODO: Implement JWT auth guard and get userId from token
// For now, using header or hardcoded userId
const MOCK_USER_ID = 1;

@ApiTags('orders')
@ApiBearerAuth()
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createOrderDto: CreateOrderDto) {
    // TODO: Get userId from JWT token
    return this.ordersService.create(MOCK_USER_ID, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for current user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Query() query: QueryOrdersDto) {
    // TODO: Get userId from JWT token
    return this.ordersService.findAll(MOCK_USER_ID, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    return this.ordersService.findOne(id, MOCK_USER_ID);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    // TODO: Get userId from JWT token
    return this.ordersService.update(id, MOCK_USER_ID, updateOrderDto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    return this.ordersService.cancel(id, MOCK_USER_ID);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get order tracking information' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Tracking info retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getTracking(@Param('id', ParseIntPipe) id: number) {
    // TODO: Get userId from JWT token
    return this.ordersService.getTracking(id, MOCK_USER_ID);
  }
}
