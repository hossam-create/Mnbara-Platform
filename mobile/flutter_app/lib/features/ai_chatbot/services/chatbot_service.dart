// Chatbot Service - خدمة الدردشة الذكية
import '../../../core/network/api_client.dart';

class ChatbotService {
  static const String baseUrl = '/api/v1/chat';

  // Create conversation
  Future<Map<String, dynamic>> createConversation({
    String? userId,
    required String sessionId,
    String channel = 'MOBILE',
    String language = 'ar',
  }) async {
    final response = await ApiClient.post('$baseUrl/conversations', {
      'userId': userId,
      'sessionId': sessionId,
      'channel': channel,
      'language': language,
    });
    return response['data'];
  }

  // Send message
  Future<Map<String, dynamic>> sendMessage({
    required String conversationId,
    required String content,
    String language = 'ar',
  }) async {
    final response = await ApiClient.post(
      '$baseUrl/conversations/$conversationId/messages',
      {
        'content': content,
        'language': language,
      },
    );
    return response['data'];
  }

  // Get conversation history
  Future<List<Map<String, dynamic>>> getConversation(String conversationId) async {
    final response = await ApiClient.get('$baseUrl/conversations/$conversationId');
    return List<Map<String, dynamic>>.from(response['data']['messages']);
  }

  // Rate conversation
  Future<void> rateConversation({
    required String conversationId,
    required int rating,
    String? feedback,
  }) async {
    await ApiClient.post('$baseUrl/conversations/$conversationId/rate', {
      'rating': rating,
      'feedback': feedback,
    });
  }

  // Escalate to agent
  Future<void> escalateToAgent({
    required String conversationId,
    String? reason,
  }) async {
    await ApiClient.post('$baseUrl/conversations/$conversationId/escalate', {
      'reason': reason,
    });
  }

  // Close conversation
  Future<void> closeConversation(String conversationId) async {
    await ApiClient.post('$baseUrl/conversations/$conversationId/close', {});
  }
}
