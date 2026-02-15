// Wholesale Service - خدمة البيع بالجملة
import '../../../core/network/api_client.dart';

class WholesaleService {
  static const String baseUrl = '/api/v1/wholesale';

  // Get products
  Future<List<Map<String, dynamic>>> getProducts({
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    String url = '$baseUrl/products?page=$page&limit=$limit';
    if (category != null) url += '&category=$category';
    final response = await ApiClient.get(url);
    return List<Map<String, dynamic>>.from(response['products']);
  }

  // Get product details
  Future<Map<String, dynamic>> getProduct(String productId) async {
    return await ApiClient.get('$baseUrl/products/$productId');
  }

  // Create order
  Future<Map<String, dynamic>> createOrder({
    required String productId,
    required int quantity,
    String? notes,
  }) async {
    return await ApiClient.post('$baseUrl/orders', {
      'productId': productId,
      'quantity': quantity,
      'notes': notes,
    });
  }

  // Send inquiry
  Future<void> sendInquiry({
    required String productId,
    required String message,
  }) async {
    await ApiClient.post('$baseUrl/inquiries', {
      'productId': productId,
      'message': message,
    });
  }

  // Get my orders
  Future<List<Map<String, dynamic>>> getMyOrders() async {
    final response = await ApiClient.get('$baseUrl/orders/my');
    return List<Map<String, dynamic>>.from(response['orders']);
  }

  // Get pricing tiers
  Future<List<Map<String, dynamic>>> getPricingTiers(String productId) async {
    final response = await ApiClient.get('$baseUrl/products/$productId/pricing');
    return List<Map<String, dynamic>>.from(response['tiers']);
  }
}
