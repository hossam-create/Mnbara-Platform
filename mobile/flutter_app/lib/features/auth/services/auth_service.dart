import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../models/user_model.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(apiClientProvider));
});

class AuthService {
  final ApiClient _apiClient;
  final _storage = const FlutterSecureStorage();

  AuthService(this._apiClient);

  Future<User> login(String email, String password) async {
    final response = await _apiClient.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    
    final token = response.data['token'];
    await _storage.write(key: 'auth_token', value: token);
    
    return User.fromJson(response.data['user']);
  }

  Future<User> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _apiClient.post('/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
      if (phone != null) 'phone': phone,
    });
    
    return User.fromJson(response.data['user']);
  }

  Future<void> forgotPassword(String email) async {
    await _apiClient.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> verifyOtp(String email, String otp, String type) async {
    await _apiClient.post('/auth/verify-otp', data: {
      'email': email,
      'otp': otp,
      'type': type,
    });
  }

  Future<void> resendOtp(String email) async {
    await _apiClient.post('/auth/resend-otp', data: {'email': email});
  }

  Future<void> resetPassword(String email, String otp, String newPassword) async {
    await _apiClient.post('/auth/reset-password', data: {
      'email': email,
      'otp': otp,
      'newPassword': newPassword,
    });
  }

  Future<User> loginWithGoogle(String idToken) async {
    final response = await _apiClient.post('/auth/google', data: {'idToken': idToken});
    final token = response.data['token'];
    await _storage.write(key: 'auth_token', value: token);
    return User.fromJson(response.data['user']);
  }

  Future<User> loginWithApple(String identityToken) async {
    final response = await _apiClient.post('/auth/apple', data: {'identityToken': identityToken});
    final token = response.data['token'];
    await _storage.write(key: 'auth_token', value: token);
    return User.fromJson(response.data['user']);
  }

  Future<User> loginWithFacebook(String accessToken) async {
    final response = await _apiClient.post('/auth/facebook', data: {'accessToken': accessToken});
    final token = response.data['token'];
    await _storage.write(key: 'auth_token', value: token);
    return User.fromJson(response.data['user']);
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<User?> getCurrentUser() async {
    final token = await getToken();
    if (token == null) return null;
    
    try {
      final response = await _apiClient.get('/auth/me');
      return User.fromJson(response.data['user']);
    } catch (e) {
      return null;
    }
  }
}
