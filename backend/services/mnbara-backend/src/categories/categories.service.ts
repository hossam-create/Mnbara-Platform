// src/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  private categories = [];

  async findAll() {
    return this.categories;
  }

  async findOne(id: string) {
    return this.categories.find(category => category.id === id);
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const category = { id: Date.now().toString(), ...createCategoryDto };
    this.categories.push(category);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const index = this.categories.findIndex(category => category.id === id);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updateCategoryDto };
      return this.categories[index];
    }
    return null;
  }

  async remove(id: string) {
    this.categories = this.categories.filter(category => category.id !== id);
    return { message: 'Category deleted successfully' };
  }
}