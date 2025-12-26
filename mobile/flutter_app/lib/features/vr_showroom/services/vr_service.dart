// VR Showroom Service - خدمة صالة العرض الافتراضية
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';

final vrServiceProvider = Provider<VRService>((ref) {
  return VRService(ref.read(apiClientProvider));
});

class VRService {
  final ApiClient _apiClient;
  
  VRService(this._apiClient);

  // Get available showrooms
  Future<List<Map<String, dynamic>>> getShowrooms({String? category}) async {
    final response = await _apiClient.get('/vr/showrooms', queryParameters: {
      if (category != null) 'category': category,
    });
    return List<Map<String, dynamic>>.from(response.data['showrooms'] ?? []);
  }

  // Get showroom details
  Future<Map<String, dynamic>> getShowroomDetails(String showroomId) async {
    final response = await _apiClient.get('/vr/showrooms/$showroomId');
    return response.data;
  }

  // Start VR session
  Future<Map<String, dynamic>> startSession(String showroomId, {String? avatarId}) async {
    final response = await _apiClient.post('/vr/sessions', data: {
      'showroomId': showroomId,
      if (avatarId != null) 'avatarId': avatarId,
    });
    return response.data;
  }

  // End VR session
  Future<void> endSession(String sessionId) async {
    await _apiClient.post('/vr/sessions/$sessionId/end');
  }

  // Get user's avatar
  Future<Map<String, dynamic>> getAvatar() async {
    final response = await _apiClient.get('/vr/avatar');
    return response.data;
  }

  // Update avatar customization
  Future<Map<String, dynamic>> updateAvatar(Map<String, dynamic> customization) async {
    final response = await _apiClient.put('/vr/avatar', data: customization);
    return response.data;
  }

  // Get products in showroom
  Future<List<Map<String, dynamic>>> getShowroomProducts(String showroomId) async {
    final response = await _apiClient.get('/vr/showrooms/$showroomId/products');
    return List<Map<String, dynamic>>.from(response.data['products'] ?? []);
  }

  // Interact with product in VR
  Future<Map<String, dynamic>> interactWithProduct(String sessionId, String productId, String action) async {
    final response = await _apiClient.post('/vr/sessions/$sessionId/interact', data: {
      'productId': productId,
      'action': action, // 'view', 'rotate', 'zoom', 'add_to_cart'
    });
    return response.data;
  }

  // Get upcoming VR events
  Future<List<Map<String, dynamic>>> getEvents() async {
    final response = await _apiClient.get('/vr/events');
    return List<Map<String, dynamic>>.from(response.data['events'] ?? []);
  }

  // Join VR event
  Future<Map<String, dynamic>> joinEvent(String eventId) async {
    final response = await _apiClient.post('/vr/events/$eventId/join');
    return response.data;
  }
}
