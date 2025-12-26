import 'package:equatable/equatable.dart';
import '../../profile/providers/address_provider.dart';

enum OrderStatus { pending, confirmed, processing, shipped, delivered, cancelled }

class Order extends Equatable {
  final String id;
  final List<OrderItem> items;
  final OrderStatus status;
  final double subtotal;
  final double shipping;
  final double tax;
  final double discount;
  final double total;
  final Address shippingAddress;
  final String paymentMethod;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? deliveryId; // For live tracking

  const Order({
    required this.id,
    required this.items,
    required this.status,
    required this.subtotal,
    required this.shipping,
    required this.tax,
    required this.discount,
    required this.total,
    required this.shippingAddress,
    required this.paymentMethod,
    required this.createdAt,
    this.updatedAt,
    this.deliveryId,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      items: (json['items'] as List).map((e) => OrderItem.fromJson(e)).toList(),
      status: OrderStatus.values.firstWhere((e) => e.name == json['status']),
      subtotal: (json['subtotal'] as num).toDouble(),
      shipping: (json['shipping'] as num).toDouble(),
      tax: (json['tax'] as num).toDouble(),
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num).toDouble(),
      shippingAddress: Address.fromJson(json['shippingAddress']),
      paymentMethod: json['paymentMethod'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      deliveryId: json['deliveryId'],
    );
  }

  @override
  List<Object?> get props => [id, items, status, total, createdAt, deliveryId];
}

class OrderItem extends Equatable {
  final String productId;
  final String name;
  final String image;
  final int quantity;
  final double price;

  const OrderItem({
    required this.productId,
    required this.name,
    required this.image,
    required this.quantity,
    required this.price,
  });

  double get total => price * quantity;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: json['productId'],
      name: json['name'],
      image: json['image'],
      quantity: json['quantity'],
      price: (json['price'] as num).toDouble(),
    );
  }

  @override
  List<Object?> get props => [productId, name, quantity, price];
}
