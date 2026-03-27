import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateQuantityDto } from './dto/update-quantity.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Cart')
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return {
      success: true,
      status: 'ok',
      service: 'cart-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, description: 'Cart contents' })
  async getCart(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const cart = await this.cartService.getCart(userId);
    return { success: true, data: cart };
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 200, description: 'Updated cart' })
  async addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    const userId = req.user.sub || req.user.id;
    const cart = await this.cartService.addToCart(userId, dto.productId, dto.quantity);
    return { success: true, data: cart };
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Updated cart' })
  async removeFromCart(@Req() req: any, @Param('productId') productId: string) {
    const userId = req.user.sub || req.user.id;
    const cart = await this.cartService.removeFromCart(userId, productId);
    return { success: true, data: cart };
  }

  @Put('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update item quantity' })
  @ApiResponse({ status: 200, description: 'Updated cart' })
  async updateQuantity(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    const userId = req.user.sub || req.user.id;
    const cart = await this.cartService.updateQuantity(userId, productId, dto.quantity);
    return { success: true, data: cart };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 204, description: 'Cart cleared' })
  async clearCart(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    await this.cartService.clearCart(userId);
  }
}
