import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Headers,
  HttpCode, HttpStatus, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'sellerId', required: false }) @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false }) @ApiQuery({ name: 'condition', required: false })
  @ApiQuery({ name: 'minPrice', required: false }) @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false })
  async getProducts(
    @Query('sellerId') sellerId?: string, @Query('categoryId') categoryId?: string,
    @Query('status') status?: string, @Query('condition') condition?: string,
    @Query('listingType') listingType?: string,
    @Query('minPrice') minPrice?: string, @Query('maxPrice') maxPrice?: string,
    @Query('city') city?: string, @Query('country') country?: string,
    @Query('isAuction') isAuction?: string,
    @Query('page') page?: string, @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string, @Query('sortOrder') sortOrder?: string,
  ) {
    const filters = {
      sellerId, categoryId, status: status as any, condition: condition as any,
      listingType: listingType as any,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      city, country,
      isAuction: isAuction === 'true' ? true : isAuction === 'false' ? false : undefined,
    };
    const pagination = {
      page: parseInt(page || '1'), limit: parseInt(limit || '20'),
      sortBy: sortBy || 'createdAt', sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    };
    const result = await this.productService.getProducts(filters, pagination);
    return {
      success: true, data: result.products,
      pagination: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProduct(@Param('id') id: string, @Query('incrementViews') incrementViews?: string) {
    const product = await this.productService.getProductById(id, incrementViews === 'true');
    if (!product) throw new NotFoundException('Product not found');
    return { success: true, data: product };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product' })
  async createProduct(@Body() body: any, @Headers('x-seller-id') sellerId?: string) {
    const sid = (body as any).sellerId || sellerId;
    if (!sid) throw new BadRequestException('Seller ID required');
    if (body.auctionEndsAt) body.auctionEndsAt = new Date(body.auctionEndsAt);
    const product = await this.productService.createProduct(body, sid);
    return { success: true, data: product };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(@Param('id') id: string, @Body() body: any, @Headers('x-seller-id') sellerId?: string) {
    const sid = (body as any).sellerId || sellerId;
    if (!sid) throw new BadRequestException('Seller ID required');
    if (body.auctionEndsAt) body.auctionEndsAt = new Date(body.auctionEndsAt);
    const product = await this.productService.updateProduct(id, body, sid);
    return { success: true, data: product };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  async deleteProduct(@Param('id') id: string, @Headers('x-seller-id') sellerId?: string) {
    if (!sellerId) throw new BadRequestException('Seller ID required');
    await this.productService.deleteProduct(id, sellerId);
    return { success: true, message: 'Product deleted successfully' };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish product' })
  async publishProduct(@Param('id') id: string, @Headers('x-seller-id') sellerId?: string) {
    if (!sellerId) throw new BadRequestException('Seller ID required');
    const product = await this.productService.publishProduct(id, sellerId);
    return { success: true, data: product, message: 'Product published successfully' };
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause product' })
  async pauseProduct(@Param('id') id: string, @Headers('x-seller-id') sellerId?: string) {
    const product = await this.productService.pauseProduct(id, sellerId || 'test-seller-id');
    return { success: true, data: product, message: 'Product paused successfully' };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive product' })
  async archiveProduct(@Param('id') id: string, @Headers('x-seller-id') sellerId?: string) {
    const product = await this.productService.archiveProduct(id, sellerId || 'test-seller-id');
    return { success: true, data: product, message: 'Product archived successfully' };
  }

  @Post(':id/sold')
  @ApiOperation({ summary: 'Mark product as sold' })
  async markAsSold(@Param('id') id: string, @Headers('x-buyer-id') buyerId?: string) {
    const product = await this.productService.markAsSold(id, buyerId || 'test-buyer-id');
    return { success: true, data: product, message: 'Product marked as sold' };
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like product' })
  async likeProduct(@Param('id') id: string) {
    await this.productService.likeProduct(id);
    return { success: true, message: 'Product liked' };
  }
}
