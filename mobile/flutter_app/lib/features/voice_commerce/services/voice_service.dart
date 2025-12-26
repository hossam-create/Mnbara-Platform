// Voice Commerce Service - خدمة التجارة الصوتية
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/network/api_client.dart';

class VoiceService {
  static const String baseUrl = '/api/v1/voice';

  // Start voice session
  Future<Map<String, dynamic>> startSession({
    required String userId,
    String language = 'ar',
  }) async {
    final response = await ApiClient.post('$baseUrl/sessions', {
      'userId': userId,
      'language': language,
    });
    return response;
  }

  // Process voice command
  Future<Map<String, dynamic>> processVoice({
    required String sessionId,
    required String audioBase64,
    String language = 'ar',
  }) async {
    final response = await ApiClient.post('$baseUrl/process', {
      'sessionId': sessionId,
      'audio': audioBase64,
      'language': language,
    });
    return response;
  }

  // Get text-to-speech
  Future<String> textToSpeech({
    required String text,
    String language = 'ar',
    String voice = 'female',
  }) async {
    final response = await ApiClient.post('$baseUrl/tts', {
      'text': text,
      'language': language,
      'voice': voice,
    });
    return response['audioUrl'];
  }

  // End session
  Future<void> endSession(String sessionId) async {
    await ApiClient.post('$baseUrl/sessions/$sessionId/end', {});
  }
}
