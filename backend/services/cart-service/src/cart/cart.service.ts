import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CartService implements OnModuleDestroy {
  private readonly logger = new Logger(CartService.name);
  private readonly redis: Redis;
  private readonly CART_TTL = 86400 * 7; // 7 days

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
    this.redis.on('connect', () => this.logger.log('Redis connected'));
    this.redis.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Redis disconnected');
  }

  private cartKey(userId: string): string {
    return `cart:${userId}`;
  }

  async getCart(userId: string): Promise<Record<string, string>> {
    return this.redis.hgetall(this.cartKey(userId));
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<Record<string, string>> {
    const key = this.cartKey(userId);
    const cart = await this.redis.hgetall(key);
    const currentQty = parseInt(cart[productId] || '0');

    await this.redis.hset(key, productId, currentQty + quantity);
    await this.redis.expire(key, this.CART_TTL);

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, productId: string): Promise<Record<string, string>> {
    await this.redis.hdel(this.cartKey(userId), productId);
    return this.getCart(userId);
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<Record<string, string>> {
    const key = this.cartKey(userId);
    if (quantity <= 0) {
      await this.redis.hdel(key, productId);
    } else {
      await this.redis.hset(key, productId, quantity);
    }
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.redis.del(this.cartKey(userId));
  }
}
