import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class CartService {
  async addToCart(userId: string, productId: string, quantity: number) {
    const cartKey = `cart:${userId}`;
    const cart = await redis.hgetall(cartKey);
    
    const currentQty = parseInt(cart[productId] || '0');
    await redis.hset(cartKey, productId, currentQty + quantity);
    await redis.expire(cartKey, 86400 * 7); // 7 days
    
    return await this.getCart(userId);
  }

  async getCart(userId: string) {
    const cartKey = `cart:${userId}`;
    return await redis.hgetall(cartKey);
  }

  async removeFromCart(userId: string, productId: string) {
    const cartKey = `cart:${userId}`;
    await redis.hdel(cartKey, productId);
    return await this.getCart(userId);
  }

  async updateQuantity(userId: string, productId: string, quantity: number) {
    const cartKey = `cart:${userId}`;
    if (quantity <= 0) {
      await redis.hdel(cartKey, productId);
    } else {
      await redis.hset(cartKey, productId, quantity);
    }
    return await this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cartKey = `cart:${userId}`;
    await redis.del(cartKey);
  }

  async getCartTotal(userId: string, productPrices: any) {
    const cart = await this.getCart(userId);
    let total = 0;
    
    for (const [productId, quantity] of Object.entries(cart)) {
      const price = productPrices[productId] || 0;
      total += price * parseInt(quantity as string);
    }
    
    return total;
  }
}
