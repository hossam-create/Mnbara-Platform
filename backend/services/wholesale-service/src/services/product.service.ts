// Product Service - Wholesale B2B
// خدمة المنتجات - البيع بالجملة

import { PrismaClient, WholesaleProduct, ProductStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface CreateProductDTO {
  supplierId: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  basePrice: number;
  currency?: string;
  stockQuantity: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  unitType?: string;
  unitsPerPackage?: number;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  specifications?: Record<string, any>;
  images: string[];
  videos?: string[];
  documents?: string[];
  countryOfOrigin?: string;
  hsCode?: string;
  certifications?: string[];
}

interface UpdateProductDTO {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  basePrice?: number;
  stockQuantity?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  images?: string[];
  status?: ProductStatus;
}

interface ProductFilters {
  supplierId?: string;
  category?: string;
  subcategory?: string;
  countryOfOrigin?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: ProductStatus;
}

export class ProductService {
  // ==========================================
  // 📦 PRODUCT MANAGEMENT
  // ==========================================

  // Create product
  async createProduct(data: CreateProductDTO): Promise<WholesaleProduct> {
    const sku = `WS-${data.supplierId.slice(0, 4).toUpperCase()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    return prisma.wholesaleProduct.create({
      data: {
        ...data,
        sku,
        currency: data.currency || 'USD',
        minOrderQuantity: data.minOrderQuantity || 1,
        unitType: data.unitType || 'piece',
        unitsPerPackage: data.unitsPerPackage || 1,
        videos: data.videos || [],
        documents: data.documents || [],
        certifications: data.certifications || [],
        status: 'DRAFT'
      }
    });
  }

  // Get product by ID
  async getProductById(id: string): Promise<WholesaleProduct | null> {
    return prisma.wholesaleProduct.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            businessName: true,
            businessNameAr: true,
            country: true,
            rating: true,
            isVerified: true
          }
        },
        pricingTiers: {
          orderBy: { minQuantity: 'asc' }
        }
      }
    });
  }

  // Update product
  async updateProduct(id: string, data: UpdateProductDTO): Promise<WholesaleProduct> {
    return prisma.wholesaleProduct.update({
      where: { id },
      data
    });
  }

  // Delete product (soft delete)
  async deleteProduct(id: string): Promise<WholesaleProduct> {
    return prisma.wholesaleProduct.update({
      where: { id },
      data: {
        status: 'DISCONTINUED',
        isActive: false
      }
    });
  }

  // List products with filters
  async listProducts(
    filters: ProductFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ products: WholesaleProduct[]; total: number; pages: number }> {
    const where: any = { isActive: true };

    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.category) where.category = filters.category;
    if (filters.subcategory) where.subcategory = filters.subcategory;
    if (filters.countryOfOrigin) where.countryOfOrigin = filters.countryOfOrigin;
    if (filters.status) where.status = filters.status;
    if (filters.inStock) where.stockQuantity = { gt: 0 };
    if (filters.minPrice || filters.maxPrice) {
      where.basePrice = {};
      if (filters.minPrice) where.basePrice.gte = filters.minPrice;
      if (filters.maxPrice) where.basePrice.lte = filters.maxPrice;
    }

    const [products, total] = await Promise.all([
      prisma.wholesaleProduct.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: {
            select: {
              id: true,
              businessName: true,
              country: true,
              rating: true,
              isVerified: true
            }
          },
          pricingTiers: true
        }
      }),
      prisma.wholesaleProduct.count({ where })
    ]);

    return {
      products,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  // ==========================================
  // 💰 PRICING TIERS
  // ==========================================

  // Add pricing tier
  async addPricingTier(
    productId: string,
    minQuantity: number,
    maxQuantity: number | null,
    pricePerUnit: number
  ): Promise<any> {
    return prisma.productPricingTier.create({
      data: {
        productId,
        minQuantity,
        maxQuantity,
        pricePerUnit
      }
    });
  }

  // Get price for quantity
  async getPriceForQuantity(productId: string, quantity: number): Promise<{
    unitPrice: number;
    totalPrice: number;
    savings: number;
    tier: string;
  }> {
    const product = await prisma.wholesaleProduct.findUnique({
      where: { id: productId },
      include: {
        pricingTiers: {
          orderBy: { minQuantity: 'desc' }
        }
      }
    });

    if (!product) throw new Error('Product not found');

    // Find applicable tier
    let unitPrice = product.basePrice;
    let tier = 'Base';

    for (const pricingTier of product.pricingTiers) {
      if (quantity >= pricingTier.minQuantity) {
        if (!pricingTier.maxQuantity || quantity <= pricingTier.maxQuantity) {
          unitPrice = pricingTier.pricePerUnit;
          tier = `${pricingTier.minQuantity}+ units`;
          break;
        }
      }
    }

    const totalPrice = unitPrice * quantity;
    const baseTotalPrice = product.basePrice * quantity;
    const savings = baseTotalPrice - totalPrice;

    return { unitPrice, totalPrice, savings, tier };
  }

  // ==========================================
  // 📊 INVENTORY
  // ==========================================

  // Update stock
  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<WholesaleProduct> {
    const product = await prisma.wholesaleProduct.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');

    let newQuantity: number;
    switch (operation) {
      case 'add':
        newQuantity = product.stockQuantity + quantity;
        break;
      case 'subtract':
        newQuantity = Math.max(0, product.stockQuantity - quantity);
        break;
      case 'set':
        newQuantity = quantity;
        break;
    }

    const status = newQuantity === 0 ? 'OUT_OF_STOCK' : product.status === 'OUT_OF_STOCK' ? 'ACTIVE' : product.status;

    return prisma.wholesaleProduct.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
        status
      }
    });
  }

  // Check availability
  async checkAvailability(id: string, quantity: number): Promise<{
    available: boolean;
    currentStock: number;
    minOrder: number;
    maxOrder: number | null;
  }> {
    const product = await prisma.wholesaleProduct.findUnique({ where: { id } });
    if (!product) throw new Error('Product not found');

    return {
      available: product.stockQuantity >= quantity && quantity >= product.minOrderQuantity,
      currentStock: product.stockQuantity,
      minOrder: product.minOrderQuantity,
      maxOrder: product.maxOrderQuantity
    };
  }

  // ==========================================
  // 🔍 SEARCH
  // ==========================================

  // Search products
  async searchProducts(
    query: string,
    filters: ProductFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: WholesaleProduct[]; total: number }> {
    const where: any = {
      isActive: true,
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { nameAr: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (filters.category) where.category = filters.category;
    if (filters.countryOfOrigin) where.countryOfOrigin = filters.countryOfOrigin;

    const [products, total] = await Promise.all([
      prisma.wholesaleProduct.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: {
            select: {
              id: true,
              businessName: true,
              country: true,
              rating: true
            }
          }
        }
      }),
      prisma.wholesaleProduct.count({ where })
    ]);

    return { products, total };
  }

  // Get categories
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const categories = await prisma.wholesaleProduct.groupBy({
      by: ['category'],
      where: { isActive: true, status: 'ACTIVE' },
      _count: true
    });

    return categories.map(c => ({
      category: c.category,
      count: c._count
    }));
  }
}

export const productService = new ProductService();
