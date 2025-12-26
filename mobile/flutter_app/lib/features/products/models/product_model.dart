import 'package:equatable/equatable.dart';

class Product extends Equatable {
  final String id;
  final String name;
  final String description;
  final double price;
  final double? originalPrice;
  final int discount;
  final List<String> images;
  final String categoryId;
  final String categoryName;
  final String sellerId;
  final String sellerName;
  final int stock;
  final double rating;
  final int reviewCount;
  final int views;
  final int likes;
  final String condition;
  final Map<String, dynamic>? specifications;
  final DateTime createdAt;

  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    this.discount = 0,
    required this.images,
    required this.categoryId,
    required this.categoryName,
    required this.sellerId,
    required this.sellerName,
    required this.stock,
    this.rating = 0,
    this.reviewCount = 0,
    this.views = 0,
    this.likes = 0,
    this.condition = 'new',
    this.specifications,
    required this.createdAt,
  });

  bool get isInStock => stock > 0;
  bool get hasDiscount => discount > 0;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      description: json['description'] ?? '',
      price: (json['price'] as num).toDouble(),
      originalPrice: json['originalPrice'] != null ? (json['originalPrice'] as num).toDouble() : null,
      discount: json['discount'] ?? 0,
      images: List<String>.from(json['images'] ?? []),
      categoryId: json['categoryId'] ?? '',
      categoryName: json['categoryName'] ?? '',
      sellerId: json['sellerId'] ?? '',
      sellerName: json['sellerName'] ?? '',
      stock: json['stock'] ?? 0,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: json['reviewCount'] ?? 0,
      views: json['views'] ?? 0,
      likes: json['likes'] ?? 0,
      condition: json['condition'] ?? 'new',
      specifications: json['specifications'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'originalPrice': originalPrice,
      'discount': discount,
      'images': images,
      'categoryId': categoryId,
      'categoryName': categoryName,
      'sellerId': sellerId,
      'sellerName': sellerName,
      'stock': stock,
      'rating': rating,
      'reviewCount': reviewCount,
      'views': views,
      'likes': likes,
      'condition': condition,
      'specifications': specifications,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, name, price, stock];
}
