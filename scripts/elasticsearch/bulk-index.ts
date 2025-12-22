/**
 * Bulk Indexing Script
 * Syncs all data from PostgreSQL to Elasticsearch
 * Run this for initial data migration or to rebuild indices
 */

import { PrismaClient } from '@prisma/client';
import {
  initializeIndices,
  recreateIndex,
  IndexingService,
  INDICES,
  getAllIndicesStatus,
} from '../../backend/services/shared/elasticsearch';

const prisma = new PrismaClient();
const indexingService = new IndexingService();

const BATCH_SIZE = 100;

interface BulkIndexOptions {
  recreate?: boolean;
  indices?: string[];
}

async function bulkIndexProducts(): Promise<{ total: number; indexed: number; failed: number }> {
  console.log('\n📦 Indexing Products...');
  
  let total = 0;
  let indexed = 0;
  let failed = 0;
  let skip = 0;

  while (true) {
    const products = await prisma.product.findMany({
      skip,
      take: BATCH_SIZE,
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            rating: true,
            isVerified: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    if (products.length === 0) break;

    const documents = products.map((product) => ({
      id: product.id,
      sellerId: product.sellerId,
      title: product.title,
      description: product.description || '',
      categoryId: product.categoryId,
      categoryPath: product.category?.path,
      categoryName: product.category?.name,
      price: product.price.toNumber(),
      currency: product.currency,
      condition: product.condition,
      status: product.status,
      images: product.images as string[],
      tags: product.tags as string[] || [],
      attributes: product.attributes as Record<string, unknown> || {},
      location: product.latitude && product.longitude
        ? { lat: product.latitude.toNumber(), lon: product.longitude.toNumber() }
        : undefined,
      city: product.city || undefined,
      country: product.country || undefined,
      seller: product.seller
        ? {
            id: product.seller.id,
            name: product.seller.fullName,
            rating: product.seller.rating?.toNumber() || 0,
            verified: product.seller.isVerified,
          }
        : undefined,
      viewsCount: product.viewsCount || 0,
      favoritesCount: product.favoritesCount || 0,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }));

    const result = await indexingService.bulkIndexProducts(documents);
    
    total += products.length;
    indexed += result.successful;
    failed += result.failed;

    if (result.errors.length > 0) {
      console.error('  Errors:', result.errors.slice(0, 5));
    }

    console.log(`  Processed ${total} products (${indexed} indexed, ${failed} failed)`);
    skip += BATCH_SIZE;
  }

  return { total, indexed, failed };
}

async function bulkIndexListings(): Promise<{ total: number; indexed: number; failed: number }> {
  console.log('\n📋 Indexing Listings...');
  
  let total = 0;
  let indexed = 0;
  let failed = 0;
  let skip = 0;

  while (true) {
    const listings = await prisma.listing.findMany({
      skip,
      take: BATCH_SIZE,
      include: {
        product: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                rating: true,
                isVerified: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                path: true,
              },
            },
          },
        },
      },
    });

    if (listings.length === 0) break;

    const documents = listings.map((listing) => ({
      id: listing.id,
      productId: listing.productId,
      sellerId: listing.product.sellerId,
      type: listing.type as 'fixed' | 'auction',
      title: listing.product.title,
      description: listing.product.description || '',
      categoryId: listing.product.categoryId,
      categoryPath: listing.product.category?.path,
      startPrice: listing.startPrice?.toNumber(),
      currentPrice: listing.currentPrice.toNumber(),
      buyItNowPrice: listing.buyItNowPrice?.toNumber(),
      reservePrice: listing.reservePrice?.toNumber(),
      currency: listing.product.currency,
      condition: listing.product.condition,
      status: listing.status,
      images: listing.product.images as string[],
      location: listing.product.latitude && listing.product.longitude
        ? { lat: listing.product.latitude.toNumber(), lon: listing.product.longitude.toNumber() }
        : undefined,
      city: listing.product.city || undefined,
      country: listing.product.country || undefined,
      startAt: listing.startAt.toISOString(),
      endAt: listing.endAt.toISOString(),
      bidsCount: listing.bidsCount || 0,
      viewsCount: listing.viewsCount || 0,
      watchersCount: listing.watchersCount || 0,
      featured: listing.featured || false,
      highlighted: listing.highlighted || false,
      seller: listing.product.seller
        ? {
            id: listing.product.seller.id,
            name: listing.product.seller.fullName,
            rating: listing.product.seller.rating?.toNumber() || 0,
            verified: listing.product.seller.isVerified,
          }
        : undefined,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    }));

    const result = await indexingService.bulkIndexListings(documents);
    
    total += listings.length;
    indexed += result.successful;
    failed += result.failed;

    if (result.errors.length > 0) {
      console.error('  Errors:', result.errors.slice(0, 5));
    }

    console.log(`  Processed ${total} listings (${indexed} indexed, ${failed} failed)`);
    skip += BATCH_SIZE;
  }

  return { total, indexed, failed };
}

async function bulkIndexAuctions(): Promise<{ total: number; indexed: number; failed: number }> {
  console.log('\n🔨 Indexing Auctions...');
  
  let total = 0;
  let indexed = 0;
  let failed = 0;
  let skip = 0;

  while (true) {
    const auctions = await prisma.auction.findMany({
      skip,
      take: BATCH_SIZE,
      include: {
        listing: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    fullName: true,
                    rating: true,
                    isVerified: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                    path: true,
                  },
                },
              },
            },
          },
        },
        highestBidder: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (auctions.length === 0) break;

    const documents = auctions.map((auction) => ({
      id: auction.id,
      listingId: auction.listingId,
      productId: auction.listing.productId,
      sellerId: auction.listing.product.sellerId,
      type: 'auction' as const,
      title: auction.listing.product.title,
      description: auction.listing.product.description || '',
      categoryId: auction.listing.product.categoryId,
      categoryPath: auction.listing.product.category?.path,
      startPrice: auction.listing.startPrice?.toNumber() || 0,
      currentPrice: auction.listing.currentPrice.toNumber(),
      currentBid: auction.currentBid?.toNumber() || 0,
      buyItNowPrice: auction.listing.buyItNowPrice?.toNumber(),
      reservePrice: auction.listing.reservePrice?.toNumber(),
      reserveMet: auction.reserveMet || false,
      currency: auction.listing.product.currency,
      condition: auction.listing.product.condition,
      status: auction.status,
      images: auction.listing.product.images as string[],
      location: auction.listing.product.latitude && auction.listing.product.longitude
        ? { lat: auction.listing.product.latitude.toNumber(), lon: auction.listing.product.longitude.toNumber() }
        : undefined,
      city: auction.listing.product.city || undefined,
      country: auction.listing.product.country || undefined,
      startAt: auction.listing.startAt.toISOString(),
      endAt: auction.listing.endAt.toISOString(),
      bidsCount: auction.bidsCount || 0,
      uniqueBidders: auction.uniqueBidders || 0,
      highestBidder: auction.highestBidder
        ? {
            id: auction.highestBidder.id,
            name: auction.highestBidder.fullName,
          }
        : undefined,
      autoExtend: auction.autoExtend || false,
      extensionMinutes: auction.extensionMinutes || 5,
      featured: auction.listing.featured || false,
      seller: auction.listing.product.seller
        ? {
            id: auction.listing.product.seller.id,
            name: auction.listing.product.seller.fullName,
            rating: auction.listing.product.seller.rating?.toNumber() || 0,
            verified: auction.listing.product.seller.isVerified,
          }
        : undefined,
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
    }));

    const result = await indexingService.bulkIndexAuctions(documents);
    
    total += auctions.length;
    indexed += result.successful;
    failed += result.failed;

    if (result.errors.length > 0) {
      console.error('  Errors:', result.errors.slice(0, 5));
    }

    console.log(`  Processed ${total} auctions (${indexed} indexed, ${failed} failed)`);
    skip += BATCH_SIZE;
  }

  return { total, indexed, failed };
}

async function bulkIndexCategories(): Promise<{ total: number; indexed: number; failed: number }> {
  console.log('\n📁 Indexing Categories...');
  
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  const documents = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId || undefined,
    path: category.path || category.slug,
    level: category.level || 0,
    listingsCount: category._count.products,
    activeListingsCount: category._count.products, // Would need separate query for active only
    icon: category.icon || undefined,
    image: category.image || undefined,
    sortOrder: category.sortOrder || 0,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }));

  const result = await indexingService.bulkIndexCategories(documents);

  console.log(`  Processed ${categories.length} categories (${result.successful} indexed, ${result.failed} failed)`);

  return {
    total: categories.length,
    indexed: result.successful,
    failed: result.failed,
  };
}

async function main(options: BulkIndexOptions = {}): Promise<void> {
  console.log('🚀 Starting Bulk Indexing...\n');
  console.log('Options:', options);

  try {
    // Initialize or recreate indices
    if (options.recreate) {
      console.log('\n🔄 Recreating indices...');
      const indicesToRecreate = options.indices || Object.values(INDICES);
      for (const index of indicesToRecreate) {
        await recreateIndex(index);
      }
    } else {
      await initializeIndices();
    }

    // Index all data
    const results = {
      products: await bulkIndexProducts(),
      listings: await bulkIndexListings(),
      auctions: await bulkIndexAuctions(),
      categories: await bulkIndexCategories(),
    };

    // Refresh indices
    console.log('\n🔄 Refreshing indices...');
    await indexingService.refreshAllIndices();

    // Print summary
    console.log('\n✅ Bulk Indexing Complete!\n');
    console.log('Summary:');
    console.log('─'.repeat(50));
    
    for (const [name, result] of Object.entries(results)) {
      console.log(`  ${name}: ${result.indexed}/${result.total} indexed (${result.failed} failed)`);
    }

    // Print index stats
    console.log('\nIndex Statistics:');
    console.log('─'.repeat(50));
    const stats = await getAllIndicesStatus();
    for (const stat of stats) {
      const sizeMB = (stat.sizeInBytes / 1024 / 1024).toFixed(2);
      console.log(`  ${stat.name}: ${stat.docsCount} docs, ${sizeMB} MB`);
    }

  } catch (error) {
    console.error('\n❌ Bulk indexing failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: BulkIndexOptions = {
  recreate: args.includes('--recreate'),
  indices: args.includes('--indices')
    ? args[args.indexOf('--indices') + 1]?.split(',')
    : undefined,
};

main(options);
