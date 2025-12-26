import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/product_model.dart';
import '../services/product_service.dart';

final productServiceProvider = Provider<ProductService>((ref) {
  return ProductService(ref.read(apiClientProvider));
});

final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final service = ref.read(productServiceProvider);
  return service.getFeaturedProducts();
});

final newArrivalsProvider = FutureProvider<List<Product>>((ref) async {
  final service = ref.read(productServiceProvider);
  return service.getNewArrivals();
});

final bestSellersProvider = FutureProvider<List<Product>>((ref) async {
  final service = ref.read(productServiceProvider);
  return service.getBestSellers();
});

final productDetailsProvider = FutureProvider.family<Product, String>((ref, productId) async {
  final service = ref.read(productServiceProvider);
  return service.getProductById(productId);
});

final categoryProductsProvider = FutureProvider.family<List<Product>, String>((ref, categoryId) async {
  final service = ref.read(productServiceProvider);
  return service.getProductsByCategory(categoryId);
});

final relatedProductsProvider = FutureProvider.family<List<Product>, String>((ref, productId) async {
  final service = ref.read(productServiceProvider);
  return service.getRelatedProducts(productId);
});
