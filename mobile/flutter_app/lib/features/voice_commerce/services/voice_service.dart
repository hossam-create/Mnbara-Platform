import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:geolocator/geolocator.dart';

import '../../../../core/models/category.dart';
import '../../search/models/search_filters.dart';

class VoiceService {
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  bool _isListening = false;

  // Voice commands recognition - التعرف على أوامر الصوت
  final Map<String, List<String>> _voiceCommands = {
    'search': [
      'ابحث عن',
      'أعطني',
      'أريد',
      'عاوز',
      'show me',
      'find',
      'search for',
    ],
    'filter': [
      'بسعر',
      'بحالة',
      'بموقع',
      'بماركة',
      'within',
      'under',
      'over',
      'near',
    ],
    'navigate': ['اذهب إلى', 'افتح', 'شوف', 'go to', 'open', 'show'],
    'compare': ['قارن', 'مقارنة', 'compare', 'versus'],
    'add_to_cart': ['ضف للسلة', 'احجز', 'add to cart', 'buy'],
  };

  // Initialize voice service - تهيئة خدمة الصوت
  Future<bool> initialize() async {
    bool available = await _speechToText.initialize(
      onStatus: (status) => debugPrint('Voice status: $status'),
      onError: (error) => debugPrint('Voice error: $error'),
    );

    return available;
  }

  // Start listening - بدء الاستماع
  Future<void> startListening({
    required Function(String) onResult,
    Function()? onListeningStarted,
    Function()? onListeningStopped,
    String locale = 'ar_SA',
  }) async {
    if (_isListening) return;

    _isListening = true;
    onListeningStarted?.call();

    await _speechToText.listen(
      onResult: (result) {
        if (result.finalResult) {
          onResult(result.recognizedWords);
          _processVoiceCommand(result.recognizedWords);
        }
      },
      localeId: locale,
      listenMode: stt.ListenMode.confirmation,
      partialResults: true,
      listenFor: const Duration(seconds: 10),
      cancelOnError: true,
      onSoundLevelChange: (level) => debugPrint('Sound level: $level'),
    );
  }

  // Stop listening - إيقاف الاستماع
  Future<void> stopListening() async {
    if (!_isListening) return;

    await _speechToText.stop();
    _isListening = false;
  }

  // Process voice command - معالجة أوامر الصوت
  Future<VoiceCommandResult> _processVoiceCommand(String command) async {
    final lowerCommand = command.toLowerCase();

    // Detect command type - اكتشاف نوع الأمر
    final String? commandType = _detectCommandType(lowerCommand);

    // Extract entities - استخراج الكيانات
    final entities = _extractEntities(lowerCommand);

    // Get user location - الحصول على موقع المستخدم
    final Position? position = await _getUserLocation();

    return VoiceCommandResult(
      originalCommand: command,
      commandType: commandType,
      entities: entities,
      location: position,
      timestamp: DateTime.now(),
    );
  }

  // Detect command type - اكتشاف نوع الأمر
  String? _detectCommandType(String command) {
    for (final entry in _voiceCommands.entries) {
      for (final keyword in entry.value) {
        if (command.contains(keyword)) {
          return entry.key;
        }
      }
    }
    return null;
  }

  // Extract entities from command - استخراج الكيانات من الأمر
  Map<String, dynamic> _extractEntities(String command) {
    final entities = <String, dynamic>{};

    // Extract product/category names - استخراج أسماء المنتجات/التصنيفات
    final productMatch = RegExp(
      r'(موبايل|لابتوب|تلفزيون|سيارة|ملابس|أحذية)',
    ).firstMatch(command);
    if (productMatch != null) {
      entities['product'] = productMatch.group(0);
    }

    // Extract price range - استخراج نطاق السعر
    final priceMatch = RegExp(
      r'(\d+)\s*(جنيه|ريال|دولار|درهم)',
    ).firstMatch(command);
    if (priceMatch != null) {
      entities['price'] = int.parse(priceMatch.group(1)!);
    }

    // Extract location - استخراج الموقع
    final locationMatch = RegExp(
      r'(في|ب|near|in)\s+([\w\s]+)',
    ).firstMatch(command);
    if (locationMatch != null) {
      entities['location'] = locationMatch.group(2)?.trim();
    }

    return entities;
  }

  // Get user location - الحصول على موقع المستخدم
  Future<Position?> _getUserLocation() async {
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      debugPrint('Failed to get location: $e');
      return null;
    }
  }

  // Search products by voice - البحث عن المنتجات بالصوت
  Future<List<dynamic>> searchProductsByVoice({
    required String voiceQuery,
    String language = 'ar',
    SearchFilters? baseFilters,
  }) async {
    final commandResult = await _processVoiceCommand(voiceQuery);

    // Build search filters based on voice command - بناء فلاتر البحث بناءً على أمر الصوت
    final filters = baseFilters?.copyWith() ?? SearchFilters();

    if (commandResult.entities.containsKey('price')) {
      filters.maxPrice = commandResult.entities['price'];
    }

    if (commandResult.entities.containsKey('location') &&
        commandResult.location != null) {
      filters.location = commandResult.entities['location'];
      filters.radiusKm = 10; // 10km radius - نصف قطر 10 كم
    }

    if (commandResult.entities.containsKey('product')) {
      filters.query = commandResult.entities['product'];
    }

    // Here you would call your search API with the constructed filters
    // هنا ستقوم باستدعاء واجهة البحث الخاصة بك مع الفلاتر المُنشأة

    return []; // Replace with actual search results - استبدل بنتائج البحث الفعلية
  }

  // Compare products by voice - مقارنة المنتجات بالصوت
  Future<void> compareProductsByVoice(String voiceQuery) async {
    final commandResult = await _processVoiceCommand(voiceQuery);

    if (commandResult.entities.containsKey('product')) {
      final productName = commandResult.entities['product'];
      // Implement product comparison logic here
      // نفذ منطق مقارنة المنتجات هنا
      debugPrint('Comparing products related to: $productName');
    }
  }

  // Navigate to category/store by voice - الانتقال إلى التصنيف/المتجر بالصوت
  Future<void> navigateByVoice(String voiceQuery) async {
    final commandResult = await _processVoiceCommand(voiceQuery);

    if (commandResult.entities.containsKey('product')) {
      final target = commandResult.entities['product'];
      // Implement navigation logic here
      // نفذ منطق الانتقال هنا
      debugPrint('Navigating to: $target');
    }
  }

  // Check if listening - التحقق من حالة الاستماع
  bool get isListening => _isListening;
}

// Voice command result - نتيجة أمر الصوت
class VoiceCommandResult {
  final String originalCommand;
  final String? commandType;
  final Map<String, dynamic> entities;
  final Position? location;
  final DateTime timestamp;

  VoiceCommandResult({
    required this.originalCommand,
    this.commandType,
    required this.entities,
    this.location,
    required this.timestamp,
  });

  @override
  String toString() {
    return 'VoiceCommandResult(originalCommand: $originalCommand, commandType: $commandType, entities: $entities, location: $location)';
  }
}
