import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { 
  Category, 
  CategoryFilters, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  CategoryTree 
} from '../../shared/models';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getCategories(@Query() filters?: CategoryFilters): Promise<Category[]> {
    return this.categoryService.getCategories(filters);
  }

  @Get('tree')
  async getCategoryTree(): Promise<CategoryTree> {
    return this.categoryService.getCategoryTree();
  }

  @Get(':id')
  async getCategory(@Param('id') id: string): Promise<Category> {
    return this.categoryService.getCategory(id);
  }

  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryRequest): Promise<Category> {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Put(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryRequest
  ): Promise<Category> {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string): Promise<void> {
    return this.categoryService.deleteCategory(id);
  }

  @Get(':id/subcategories')
  async getSubcategories(@Param('id') id: string): Promise<Category[]> {
    return this.categoryService.getSubcategories(id);
  }

  @Get('search/:query')
  async searchCategories(@Param('query') query: string): Promise<Category[]> {
    return this.categoryService.searchCategories(query);
  }
}