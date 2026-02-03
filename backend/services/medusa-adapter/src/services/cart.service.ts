import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AddToCartInput {
  variantId: string;
  quantity: number;
}

export class CartService {
  async createCart(customerId?: string, email?: string) {
    return await prisma.cart.create({
      data: {
        customerId,
        email
      },
      include: {
        items: true
      }
    });
  }

  async getCart(id: string) {
    return await prisma.cart.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true
      }
    });
  }

  async addItem(cartId: string, data: AddToCartInput) {
    // Get variant details
    const variant = await prisma.productVariant.findUnique({
      where: { id: data.variantId },
      include: {
        product: true,
        prices: {
          where: { currencyCode: 'SAR' }
        }
      }
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        variantId: data.variantId
      }
    });

    if (existingItem) {
      // Update quantity
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + data.quantity
        }
      });
    }

    // Add new item
    return await prisma.cartItem.create({
      data: {
        cartId,
        variantId: data.variantId,
        title: variant.product.title,
        description: variant.product.description,
        thumbnail: variant.product.thumbnail,
        unitPrice: variant.prices[0]?.amount || 0,
        quantity: data.quantity
      }
    });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return await prisma.cartItem.delete({
        where: { id: itemId }
      });
    }

    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
  }

  async removeItem(itemId: string) {
    return await prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  async clearCart(cartId: string) {
    await prisma.cartItem.deleteMany({
      where: { cartId }
    });

    return await this.getCart(cartId);
  }

  async getCartTotal(cartId: string) {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: true
      }
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    return {
      subtotal,
      total: subtotal, // Add tax, shipping, discounts later
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  async completeCart(cartId: string, customerId: string, email: string) {
    const cart = await this.getCart(cartId);

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Create order from cart
    const order = await prisma.order.create({
      data: {
        cartId,
        customerId,
        email,
        currencyCode: 'SAR',
        status: 'pending',
        items: {
          create: cart.items.map(item => ({
            title: item.title,
            description: item.description,
            thumbnail: item.thumbnail,
            variantId: item.variantId,
            unitPrice: item.unitPrice,
            quantity: item.quantity
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Mark cart as completed
    await prisma.cart.update({
      where: { id: cartId },
      data: { completedAt: new Date() }
    });

    return order;
  }
}
