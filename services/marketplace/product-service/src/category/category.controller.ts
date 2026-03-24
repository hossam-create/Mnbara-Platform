import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

const DEFAULT_CATEGORIES = [
  { id: 'electronics', nameAr: '\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u062A', nameEn: 'Electronics', icon: '📱', level: 1, productCount: 0 },
  { id: 'fashion', nameAr: '\u0645\u0648\u0636\u0629', nameEn: 'Fashion', icon: '👕', level: 1, productCount: 0 },
  { id: 'home', nameAr: '\u0627\u0644\u0645\u0646\u0632\u0644', nameEn: 'Home', icon: '🏠', level: 1, productCount: 0 },
  { id: 'vehicles', nameAr: '\u0645\u0631\u0643\u0628\u0627\u062A', nameEn: 'Vehicles', icon: '🚗', level: 1, productCount: 0 },
  { id: 'sports', nameAr: '\u0631\u064A\u0627\u0636\u0629', nameEn: 'Sports', icon: '⚽', level: 1, productCount: 0 },
];

@ApiTags('Categories')
@Controller('api/categories')
export class CategoryController {
  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories() {
    return { success: true, data: DEFAULT_CATEGORIES };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategory(@Param('id') id: string) {
    return { success: true, data: { id, name: 'Category', description: 'Category description' } };
  }
}
