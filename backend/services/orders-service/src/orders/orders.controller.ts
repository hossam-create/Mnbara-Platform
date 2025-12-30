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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { User } from '../auth/user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order (authenticated user)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createOrderDto: CreateOrderDto, @User('userId') userId: number) {
    return this.ordersService.create(userId, createOrderDto);
  }

  @Post('guest')
  @Public()
  @ApiOperation({ summary: 'Create a guest order (no authentication required)' })
  @ApiResponse({ status: 201, description: 'Guest order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createGuestOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createGuestOrder(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for current user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Query() query: QueryOrdersDto, @User('userId') userId: number) {
    return this.ordersService.findAll(userId, null, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @User('userId') userId: number) {
    return this.ordersService.findOne(id, userId, null);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @User('userId') userId: number,
  ) {
    return this.ordersService.update(id, userId, null, updateOrderDto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancel(@Param('id', ParseIntPipe) id: number, @User('userId') userId: number) {
    return this.ordersService.cancel(id, userId, null);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get order tracking information' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Tracking info retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getTracking(@Param('id', ParseIntPipe) id: number, @User('userId') userId: number) {
    return this.ordersService.getTracking(id, userId, null);
  }

  @Get('guest/:email')
  @Public()
  @ApiOperation({ summary: 'Get guest orders by email (for account creation prompt)' })
  @ApiParam({ name: 'email', description: 'Guest email address' })
  @ApiResponse({ status: 200, description: 'Guest orders retrieved' })
  getGuestOrders(@Param('email') email: string) {
    return this.ordersService.getGuestOrdersByEmail(email);
  }

  @Post(':id/confirm-delivery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm delivery and release escrow' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Escrow released' })
  confirmDelivery(@Param('id', ParseIntPipe) id: number, @User('userId') userId: number) {
    return this.ordersService.confirmDelivery(id, userId);
  }
}
