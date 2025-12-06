// src/products/dto/index.ts
export class CreateProductDto {
  name: string;
  description: string;
  price: number;
  categoryId: string;
}

export class UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
}