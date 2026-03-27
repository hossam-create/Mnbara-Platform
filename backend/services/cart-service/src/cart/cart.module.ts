import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  controllers: [CartController],
  providers: [CartService, JwtAuthGuard],
  exports: [CartService],
})
export class CartModule {}
