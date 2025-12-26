// AR Preview Service - خدمة الواقع المعزز
import '../../../core/network/api_client.dart';

class ARService {
  static const String baseUrl = '/api/v1/ar';

  // Get 3D model for product
  Future<Map<String, dynamic>> get3DModel(String productId) async {
    final response = await ApiClient.get('$baseUrl/models/$productId');
    return response;
  }

  // Start AR session
  Future<Map<String, dynamic>> startSession({
    required String productId,
    required String userId,
    required String deviceType,
  }) async {
    final response = await ApiClient.post('$baseUrl/sessions', {
      'productId': productId,
      'userId': userId,
      'deviceType': deviceType,
    });
    return response;
  }

  // Save screenshot
  Future<String> saveScreenshot({
    required String sessionId,
    required String imageBase64,
  }) async {
    final response = await ApiClient.post('$baseUrl/sessions/$sessionId/screenshot', {
      'image': imageBase64,
    });
    return response['screenshotUrl'];
  }

  // End session with analytics
  Future<void> endSession({
    required String sessionId,
    required int duration,
    required int interactions,
  }) async {
    await ApiClient.post('$baseUrl/sessions/$sessionId/end', {
      'duration': duration,
      'interactions': interactions,
    });
  }

  // Get AR-enabled products
  Future<List<Map<String, dynamic>>> getARProducts({int page = 1, int limit = 20}) async {
    final response = await ApiClient.get('$baseUrl/products?page=$page&limit=$limit');
    return List<Map<String, dynamic>>.from(response['products']);
  }
}
