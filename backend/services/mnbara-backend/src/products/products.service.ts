// src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  private products = [];

  async findAll() {
    return this.products;
  }

  async findOne(id: string) {
    return this.products.find(product => product.id === id);
  }

  async create(createProductDto: CreateProductDto) {
    const product = { id: Date.now().toString(), ...createProductDto };
    this.products.push(product);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const index = this.products.findIndex(product => product.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updateProductDto };
      return this.products[index];
    }
    return null;
  }

  async remove(id: string) {
    this.products = this.products.filter(product => product.id !== id);
    return { message: 'Product deleted successfully' };
  }
}