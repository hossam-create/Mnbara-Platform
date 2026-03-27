import '../../../core/network/api_client.dart';
import '../models/product_model.dart';

class ProductService {
  final ApiClient _apiClient;

  ProductService(this._apiClient);

  Future<Product> getProduct(String id) async {
    final response = await _apiClient.get('/products/$id');
    return Product.fromJson(response.data['product']);
  }

  Future<List<Product>> getFeaturedProducts({int limit = 10}) async {
    final response = await _apiClient.get('/products', queryParameters: {
      'featured': true,
      'limit': limit,
    });
    return (response.data['products'] as List)
        .map((p) => Product.fromJson(p))
        .toList();
  }

  Future<List<Product>> getNewProducts({int limit = 10}) async {
    final response = await _apiClient.get('/products', queryParameters: {
      'sort': 'created_at',
      'order': 'desc',
      'limit': limit,
    });
    return (response.data['products'] as List)
        .map((p) => Product.fromJson(p))
        .toList();
  }

  Future<List<Product>> getPopularProducts({int limit = 10}) async {
    final response = await _apiClient.get('/products', queryParameters: {
      'sort': 'rating',
      'order': 'desc',
      'limit': limit,
    });
    return (response.data['products'] as List)
        .map((p) => Product.fromJson(p))
        .toList();
  }

  Future<List<Product>> getProductsByCategory(String categoryId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.get('/products', queryParameters: {
      'category_id': categoryId,
      'page': page,
      'limit': limit,
    });
    return (response.data['products'] as List)
        .map((p) => Product.fromJson(p))
        .toList();
  }

  Future<List<Product>> searchProducts(String query, {
    int page = 1,
    int limit = 20,
    String? categoryId,
    double? minPrice,
    double? maxPrice,
    String? sortBy,
    String? sortOrder,
  }) async {
    final response = await _apiClient.get('/products/search', queryParameters: {
      'q': query,
      'page': page,
      'limit': limit,
      if (categoryId != null) 'category_id': categoryId,
      if (minPrice != null) 'min_price': minPrice,
      if (maxPrice != null) 'max_price': maxPrice,
      if (sortBy != null) 'sort': sortBy,
      if (sortOrder != null) 'order': sortOrder,
    });
    return (response.data['products'] as List)
        .map((p) => Product.fromJson(p))
        .toList();
  }

  Future<List<Product>> getRelatedProducts(String productId, {int limit = 6}) async {
    final response = await _apiClient.get('/products/$productId/related', queryParameters: {
      'limit': limit,
    });
    return (response.data['products'] as List)
        .map((p) => Product.fromJson(p))
        .toList();
  }
}


  Future<Product> getProductById(String id) async {
    final response = await _apiClient.get('/products/$id');
    return Product.fromJson(response.data['product']);
  }

  Future<List<Product>> getNewArrivals({int limit = 10}) async {
    final response = await _apiClient.get('/products', queryParameters: {
      'sort': 'created_at',
      'order': 'desc',
      'limit': limit,
    });
    return (response.data['products'] as List).map((p) => Product.fromJson(p)).toList();
  }

  Future<List<Product>> getBestSellers({int limit = 10}) async {
    final response = await _apiClient.get('/products', queryParameters: {
      'sort': 'sales',
      'order': 'desc',
      'limit': limit,
    });
    return (response.data['products'] as List).map((p) => Product.fromJson(p)).toList();
  }
