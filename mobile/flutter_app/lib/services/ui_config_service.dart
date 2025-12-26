import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/ui_config.dart';

/// Service for fetching and caching dynamic UI configuration
/// This allows the app UI to change without app store updates
class UIConfigService {
  static const String _baseUrl = 'https://api.mnbara.com/api/v1/ui-config';
  static const String _cacheKey = 'ui_config_cache';
  static const String _versionKey = 'ui_config_version';
  static const Duration _cacheExpiry = Duration(minutes: 5);
  
  DateTime? _lastFetch;
  UIConfigResponse? _cachedConfig;
  
  /// Get UI configuration with caching
  Future<UIConfigResponse> getUIConfig({
    String platform = 'android',
    String language = 'ar',
    String userType = 'all',
    bool forceRefresh = false,
  }) async {
    // Check memory cache first
    if (!forceRefresh && _cachedConfig != null && _lastFetch != null) {
      if (DateTime.now().difference(_lastFetch!) < _cacheExpiry) {
        return _cachedConfig!;
      }
    }
    
    // Check disk cache
    if (!forceRefresh) {
      final cachedData = await _loadFromDisk();
      if (cachedData != null) {
        _cachedConfig = cachedData;
        _lastFetch = DateTime.now();
        
        // Fetch in background to update cache
        _fetchAndCache(platform, language, userType);
        
        return cachedData;
      }
    }
    
    // Fetch from server
    return await _fetchAndCache(platform, language, userType);
  }
  
  /// Fetch from server and cache
  Future<UIConfigResponse> _fetchAndCache(
    String platform,
    String language,
    String userType,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl?platform=$platform&lang=$language&user_type=$userType'),
        headers: {
          'Accept': 'application/json',
          'Accept-Language': language,
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final config = UIConfigResponse.fromJson(data);
        
        // Update caches
        _cachedConfig = config;
        _lastFetch = DateTime.now();
        await _saveToDisk(config);
        
        return config;
      } else if (response.statusCode == 304) {
        // Not modified, use cached version
        return _cachedConfig!;
      } else {
        throw Exception('Failed to load UI config: ${response.statusCode}');
      }
    } catch (e) {
      // If fetch fails, try to use cached data
      if (_cachedConfig != null) {
        return _cachedConfig!;
      }
      
      final cachedData = await _loadFromDisk();
      if (cachedData != null) {
        return cachedData;
      }
      
      rethrow;
    }
  }
  
  /// Check if there's a new version available
  Future<bool> checkForUpdates() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final currentVersion = prefs.getInt(_versionKey) ?? 0;
      
      final response = await http.get(
        Uri.parse('$_baseUrl/check-update?current_version=$currentVersion'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['has_update'] == true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }
  
  /// Track analytics event
  Future<void> trackEvent({
    required String type, // 'view' or 'click'
    required String entityType, // 'section', 'item', 'banner'
    required String entityId,
  }) async {
    try {
      await http.post(
        Uri.parse('$_baseUrl/analytics'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'type': type,
          'entity_type': entityType,
          'entity_id': entityId,
        }),
      );
    } catch (e) {
      // Silently fail analytics
    }
  }
  
  /// Save config to disk
  Future<void> _saveToDisk(UIConfigResponse config) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cacheKey, json.encode(config.toJson()));
      await prefs.setInt(_versionKey, config.version);
    } catch (e) {
      // Ignore cache errors
    }
  }
  
  /// Load config from disk
  Future<UIConfigResponse?> _loadFromDisk() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString(_cacheKey);
      if (cached != null) {
        return UIConfigResponse.fromJson(json.decode(cached));
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  }
  
  /// Clear all caches
  Future<void> clearCache() async {
    _cachedConfig = null;
    _lastFetch = null;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_cacheKey);
    await prefs.remove(_versionKey);
  }
}
