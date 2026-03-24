import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('payment/intent')
  @ApiOperation({ summary: 'Create payment intent' })
  async createPaymentIntent(@Body() body: any) {
    const paymentIntent = await this.paymentService.createPaymentIntent(body.amount, body.currency, body.metadata);
    return { clientSecret: paymentIntent.client_secret };
  }

  @Post('payment/confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  async confirmPayment(@Body() body: any) {
    return this.paymentService.confirmPayment(body.paymentIntentId);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create order' })
  async createOrder(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || body.userId;
    return this.paymentService.createOrder(userId, body.items, body.paymentIntentId);
  }

  @Post('payment/refund')
  @ApiOperation({ summary: 'Refund payment' })
  async refundPayment(@Body() body: any) {
    return this.paymentService.refundPayment(body.paymentIntentId, body.amount);
  }

  @Get('payment/status/:paymentIntentId')
  @ApiOperation({ summary: 'Get payment status' })
  async getPaymentStatus(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentService.getPaymentStatus(paymentIntentId);
  }
}
