import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProductInput {
  title: string;
  subtitle?: string;
  description?: string;
  handle: string;
  thumbnail?: string;
  status?: string;
  sellerId: string;
  sellerType: string;
  variants?: CreateVariantInput[];
  options?: CreateOptionInput[];
  images?: string[];
  tags?: string[];
  categoryIds?: string[];
  collectionId?: string;
  metadata?: any;
}

export interface CreateVariantInput {
  title: string;
  sku?: string;
  inventoryQuantity?: number;
  prices: { currencyCode: string; amount: number }[];
  options?: { optionId: string; value: string }[];
}

export interface CreateOptionInput {
  title: string;
  values: string[];
}

export class ProductService {
  async createProduct(data: CreateProductInput) {
    const product = await prisma.product.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        handle: data.handle,
        thumbnail: data.thumbnail,
        status: data.status || 'draft',
        sellerId: data.sellerId,
        sellerType: data.sellerType,
        collectionId: data.collectionId,
        metadata: data.metadata,
        // Create variants
        variants: data.variants ? {
          create: data.variants.map(v => ({
            title: v.title,
            sku: v.sku,
            inventoryQuantity: v.inventoryQuantity || 0,
            prices: {
              create: v.prices.map(p => ({
                currencyCode: p.currencyCode,
                amount: p.amount
              }))
            }
          }))
        } : undefined,
        // Create options
        options: data.options ? {
          create: data.options.map(o => ({
            title: o.title
          }))
        } : undefined,
        // Create images
        images: data.images ? {
          create: data.images.map(url => ({ url }))
        } : undefined
      },
      include: {
        variants: {
          include: {
            prices: true
          }
        },
        options: true,
        images: true
      }
    });

    return product;
  }

  async getProduct(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            prices: true,
            options: true
          }
        },
        options: {
          include: {
            values: true
          }
        },
        images: true,
        tags: true,
        categories: true,
        collection: true
      }
    });
  }

  async listProducts(filters: {
    status?: string;
    sellerId?: string;
    categoryId?: string;
    collectionId?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.sellerId) where.sellerId = filters.sellerId;
    if (filters.collectionId) where.collectionId = filters.collectionId;
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } }
      ];
    }

    const [products, count] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: {
            include: {
              prices: true
            }
          },
          images: true,
          tags: true
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return { products, count };
  }

  async updateProduct(id: string, data: Partial<CreateProductInput>) {
    return await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        thumbnail: data.thumbnail,
        status: data.status,
        metadata: data.metadata
      },
      include: {
        variants: {
          include: {
            prices: true
          }
        },
        options: true,
        images: true
      }
    });
  }

  async deleteProduct(id: string) {
    return await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async addVariant(productId: string, data: CreateVariantInput) {
    return await prisma.productVariant.create({
      data: {
        productId,
        title: data.title,
        sku: data.sku,
        inventoryQuantity: data.inventoryQuantity || 0,
        prices: {
          create: data.prices.map(p => ({
            currencyCode: p.currencyCode,
            amount: p.amount
          }))
        }
      },
      include: {
        prices: true
      }
    });
  }

  async updateInventory(variantId: string, quantity: number) {
    return await prisma.productVariant.update({
      where: { id: variantId },
      data: { inventoryQuantity: quantity }
    });
  }

  async getProductByHandle(handle: string) {
    return await prisma.product.findUnique({
      where: { handle },
      include: {
        variants: {
          include: {
            prices: true
          }
        },
        images: true,
        options: {
          include: {
            values: true
          }
        }
      }
    });
  }
}
