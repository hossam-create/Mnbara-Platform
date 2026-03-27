import { Injectable } from '@nestjs/common';
import { 
  Category, 
  CategoryFilters, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  CategoryTree,
  DEFAULT_CATEGORIES 
} from '../../shared/models';

@Injectable()
export class CategoryService {
  private categories: Category[] = [...DEFAULT_CATEGORIES];

  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    let filteredCategories = this.categories;

    if (filters) {
      if (filters.isActive !== undefined) {
        filteredCategories = filteredCategories.filter(c => c.isActive === filters.isActive);
      }
      if (filters.isFeatured !== undefined) {
        filteredCategories = filteredCategories.filter(c => c.isFeatured === filters.isFeatured);
      }
      if (filters.level !== undefined) {
        filteredCategories = filteredCategories.filter(c => c.level === filters.level);
      }
      if (filters.parentId !== undefined) {
        filteredCategories = filteredCategories.filter(c => c.parentId === filters.parentId);
      }
    }

    return filteredCategories.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getCategory(id: string): Promise<Category> {
    const category = this.categories.find(c => c.id === id);
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return category;
  }

  async createCategory(createCategoryDto: CreateCategoryRequest): Promise<Category> {
    const newCategory: Category = {
      id: this.generateId(),
      ...createCategoryDto,
      productCount: 0,
      level: createCategoryDto.parentId ? 2 : 1,
      sortOrder: createCategoryDto.sortOrder || this.categories.length + 1,
      isActive: createCategoryDto.isActive ?? true,
      isFeatured: createCategoryDto.isFeatured ?? false,
      searchKeywords: createCategoryDto.searchKeywords || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.categories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryRequest): Promise<Category> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Category with id ${id} not found`);
    }

    this.categories[index] = {
      ...this.categories[index],
      ...updateCategoryDto,
      updatedAt: new Date()
    };

    return this.categories[index];
  }

  async deleteCategory(id: string): Promise<void> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Category with id ${id} not found`);
    }
    this.categories.splice(index, 1);
  }

  async getSubcategories(parentId: string): Promise<Category[]> {
    return this.categories
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async searchCategories(query: string): Promise<Category[]> {
    const searchTerm = query.toLowerCase();
    return this.categories.filter(category => 
      category.nameAr.toLowerCase().includes(searchTerm) ||
      category.nameEn.toLowerCase().includes(searchTerm) ||
      category.searchKeywords.some(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      )
    );
  }

  async getCategoryTree(): Promise<CategoryTree> {
    const categories = await this.getCategories();
    const maxLevel = Math.max(...categories.map(c => c.level));
    
    return {
      categories: this.buildCategoryTree(categories),
      totalCount: categories.length,
      maxLevel
    };
  }

  private buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    // Build tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.subcategories = parent.subcategories || [];
          parent.subcategories.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}