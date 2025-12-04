// src/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  private orders = [];

  async findAll() {
    return this.orders;
  }

  async create(createOrderDto: CreateOrderDto) {
    const order = { 
      id: Date.now().toString(), 
      ...createOrderDto,
      status: 'pending',
      createdAt: new Date()
    };
    this.orders.push(order);
    return order;
  }
}