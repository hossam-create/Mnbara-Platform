import { PrismaClient } from '@prisma/client';
import { CacheService } from './CacheService';
import winston from 'winston';

export class ProductCountryService {
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService,
    private logger: winston.Logger
  ) {}

  async addCountryDataToProduct(productId: string, data: {
    originCountry: string;
    purchaseCountry: string;
    deliveryCountry: string;
  }) {
    const existing = await this.getProductCountryData(productId);
    
    if (existing) {
      return await this.updateProductCountryData(productId, data);
    }

    const productCountry = await this.prisma.productCountry.create({
      data: {
        productId,
        originCountry: data.originCountry.toUpperCase(),
        purchaseCountry: data.purchaseCountry.toUpperCase(),
        deliveryCountry: data.deliveryCountry.toUpperCase()
      },
      include: {
        originCountryRel: true,
        purchaseCountryRel: true,
        deliveryCountryRel: true
      }
    });

    // Clear cache
    await this.cache.del(`product_country:${productId}`);
    
    this.logger.info(`Country data added to product: ${productId}`);
    return productCountry;
  }

  async getProductCountryData(productId: string) {
    const cacheKey = `product_country:${productId}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const productCountry = await this.prisma.productCountry.findUnique({
      where: { productId },
      include: {
        originCountryRel: true,
        purchaseCountryRel: true,
        deliveryCountryRel: true
      }
    });

    if (productCountry) {
      await this.cache.set(cacheKey, productCountry, 1800); // 30 minutes cache
    }

    return productCountry;
  }

  async updateProductCountryData(productId: string, data: {
    originCountry?: string;
    purchaseCountry?: string;
    deliveryCountry?: string;
  }) {
    const updateData: any = {};
    
    if (data.originCountry) updateData.originCountry = data.originCountry.toUpperCase();
    if (data.purchaseCountry) updateData.purchaseCountry = data.purchaseCountry.toUpperCase();
    if (data.deliveryCountry) updateData.deliveryCountry = data.deliveryCountry.toUpperCase();

    const productCountry = await this.prisma.productCountry.update({
      where: { productId },
      data: updateData,
      include: {
        originCountryRel: true,
        purchaseCountryRel: true,
        deliveryCountryRel: true
      }
    });

    // Clear cache
    await this.cache.del(`product_country:${productId}`);
    
    this.logger.info(`Country data updated for product: ${productId}`);
    return productCountry;
  }

  async deleteProductCountryData(productId: string) {
    await this.prisma.productCountry.delete({
      where: { productId }
    });

    // Clear cache
    await this.cache.del(`product_country:${productId}`);
    
    this.logger.info(`Country data deleted for product: ${productId}`);
    return true;
  }

  async getProductsByCountry(countryIsoCode: string, countryType: 'origin' | 'purchase' | 'delivery') {
    const cacheKey = `products:${countryType}:${countryIsoCode}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    let whereClause: any = {};
    
    switch (countryType) {
      case 'origin':
        whereClause = { originCountry: countryIsoCode.toUpperCase() };
        break;
      case 'purchase':
        whereClause = { purchaseCountry: countryIsoCode.toUpperCase() };
        break;
      case 'delivery':
        whereClause = { deliveryCountry: countryIsoCode.toUpperCase() };
        break;
    }

    const products = await this.prisma.productCountry.findMany({
      where: whereClause,
      include: {
        originCountryRel: true,
        purchaseCountryRel: true,
        deliveryCountryRel: true
      }
    });

    await this.cache.set(cacheKey, products, 900); // 15 minutes cache
    return products;
  }

  async validateCountryRoute(productId: string, fromCountry: string, toCountry: string) {
    const productCountry = await this.getProductCountryData(productId);
    
    if (!productCountry) {
      return {
        valid: false,
        message: 'Product country data not found'
      };
    }

    const fromCountryUpper = fromCountry.toUpperCase();
    const toCountryUpper = toCountry.toUpperCase();

    // Check if the route matches the product's purchase to delivery countries
    const routeMatches = 
      productCountry.purchaseCountry === fromCountryUpper &&
      productCountry.deliveryCountry === toCountryUpper;

    if (!routeMatches) {
      return {
        valid: false,
        message: 'Route does not match product countries',
        productCountries: {
          purchase: productCountry.purchaseCountry,
          delivery: productCountry.deliveryCountry
        },
        requestedRoute: {
          from: fromCountryUpper,
          to: toCountryUpper
        }
      };
    }

    return {
      valid: true,
      message: 'Route is valid for this product',
      originCountry: productCountry.originCountry,
      purchaseCountry: productCountry.purchaseCountry,
      deliveryCountry: productCountry.deliveryCountry
    };
  }

  async getCountryAnalytics(productIds: string[]) {
    const analytics = await this.prisma.productCountry.groupBy({
      by: ['originCountry', 'purchaseCountry', 'deliveryCountry'],
      where: {
        productId: { in: productIds }
      },
      _count: {
        id: true
      }
    });

    return analytics.map(item => ({
      originCountry: item.originCountry,
      purchaseCountry: item.purchaseCountry,
      deliveryCountry: item.deliveryCountry,
      count: item._count.id
    }));
  }
}