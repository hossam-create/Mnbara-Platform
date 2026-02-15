import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:equatable/equatable.dart';
import '../../../core/network/api_client.dart';

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get('/categories');
  return (response.data['categories'] as List).map((e) => Category.fromJson(e)).toList();
});

final categoryProductsProvider = FutureProvider.family<List<dynamic>, String>((ref, categoryId) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get('/categories/$categoryId/products');
  return response.data['products'] as List;
});

class Category extends Equatable {
  final String id;
  final String nameAr;
  final String nameEn;
  final String? icon;
  final String? image;
  final int productCount;
  final List<Category>? subcategories;

  const Category({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    this.icon,
    this.image,
    this.productCount = 0,
    this.subcategories,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      nameAr: json['nameAr'] ?? json['name'],
      nameEn: json['nameEn'] ?? json['name'],
      icon: json['icon'],
      image: json['image'],
      productCount: json['productCount'] ?? 0,
      subcategories: json['subcategories'] != null
          ? (json['subcategories'] as List).map((e) => Category.fromJson(e)).toList()
          : null,
    );
  }

  @override
  List<Object?> get props => [id, nameAr, nameEn];
}
