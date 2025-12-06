// src/orders/dto/index.ts
export class CreateOrderDto {
  productId: string;
  quantity: number;
  totalPrice: number;
  userId: string;
}