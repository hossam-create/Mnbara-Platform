import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/traveler_location_model.dart';

/// WebSocket service for real-time location tracking
class LocationWebSocketService {
  WebSocketChannel? _channel;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  
  final _locationController = StreamController<TravelerLocation>.broadcast();
  final _statusController = StreamController<ConnectionStatus>.broadcast();
  final _storage = const FlutterSecureStorage();
  
  String? _currentDeliveryId;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const String _baseWsUrl = 'wss://api.mnbara.com/ws/tracking';

  Stream<TravelerLocation> get locationStream => _locationController.stream;
  Stream<ConnectionStatus> get statusStream => _statusController.stream;

  /// Connect to WebSocket for tracking a delivery
  Future<void> connect(String deliveryId) async {
    _currentDeliveryId = deliveryId;
    _reconnectAttempts = 0;
    await _establishConnection();
  }

  Future<void> _establishConnection() async {
    if (_currentDeliveryId == null) return;
    
    _statusController.add(ConnectionStatus.connecting);
    
    try {
      final token = await _storage.read(key: 'auth_token');
      final wsUrl = '$_baseWsUrl/$_currentDeliveryId';
      
      _channel = WebSocketChannel.connect(
        Uri.parse(wsUrl),
        protocols: token != null ? ['Bearer', token] : null,
      );

      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDone,
        cancelOnError: false,
      );

      _statusController.add(ConnectionStatus.connected);
      _reconnectAttempts = 0;
      _startHeartbeat();
      
    } catch (e) {
      _statusController.add(ConnectionStatus.error);
      _scheduleReconnect();
    }
  }

  void _handleMessage(dynamic message) {
    try {
      final data = jsonDecode(message as String) as Map<String, dynamic>;
      final type = data['type'] as String?;

      switch (type) {
        case 'location_update':
          final locationData = data['data'] as Map<String, dynamic>;
          // Merge with existing location data if available
          final location = TravelerLocation.fromJson(locationData);
          _locationController.add(location);
          break;
          
        case 'status_update':
          final statusData = data['data'] as Map<String, dynamic>;
          // Create a minimal location update with new status
          _locationController.add(TravelerLocation.fromJson({
            ...statusData,
            'delivery_id': _currentDeliveryId,
          }));
          break;
          
        case 'pong':
          // Heartbeat response received
          break;
          
        case 'error':
          final errorMsg = data['message'] ?? 'Unknown error';
          _statusController.add(ConnectionStatus.error);
          break;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  void _handleError(dynamic error) {
    _statusController.add(ConnectionStatus.error);
    _scheduleReconnect();
  }

  void _handleDone() {
    _statusController.add(ConnectionStatus.disconnected);
    _scheduleReconnect();
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _sendPing();
    });
  }

  void _sendPing() {
    try {
      _channel?.sink.add(jsonEncode({'type': 'ping'}));
    } catch (e) {
      // Connection might be closed
    }
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _statusController.add(ConnectionStatus.error);
      return;
    }

    _reconnectTimer?.cancel();
    _statusController.add(ConnectionStatus.reconnecting);
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    final delay = Duration(
      seconds: (1 << _reconnectAttempts).clamp(1, 30),
    );
    
    _reconnectTimer = Timer(delay, () {
      _reconnectAttempts++;
      _establishConnection();
    });
  }

  /// Disconnect from WebSocket
  void disconnect() {
    _heartbeatTimer?.cancel();
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _channel = null;
    _currentDeliveryId = null;
    _statusController.add(ConnectionStatus.disconnected);
  }

  /// Dispose resources
  void dispose() {
    disconnect();
    _locationController.close();
    _statusController.close();
  }
}
