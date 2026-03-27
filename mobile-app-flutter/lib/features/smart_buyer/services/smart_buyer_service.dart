import 'dart:async';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// خدمة المشتري الذكي
/// تستخدم الكاميرا والمايكروفون للتعرف على المنتجات
class SmartBuyerService {
  static final SmartBuyerService _instance = SmartBuyerService._internal();
  factory SmartBuyerService() => _instance;
  SmartBuyerService._internal();

  final _storage = const FlutterSecureStorage();
  final _speechToText = SpeechToText();
  
  CameraController? _cameraController;
  bool _isListening = false;
  bool _isCameraActive = false;
  
  static const String _baseUrl = 'https://api.mnbara.com';

  // Streams
  final _recognizedProductsController = StreamController<List<RecognizedProduct>>.broadcast();
  final _voiceQueryController = StreamController<String>.broadcast();
  
  Stream<List<RecognizedProduct>> get recognizedProducts => _recognizedProductsController.stream;
  Stream<String> get voiceQueries => _voiceQueryController.stream;

  /// تهيئة الخدمة
  Future<bool> initialize() async {
    try {
      // تهيئة التعرف على الصوت
      final speechAvailable = await _speechToText.initialize(
        onError: (error) => print('Speech error: $error'),
        onStatus: (status) => print('Speech status: $status'),
      );

      return speechAvailable;
    } catch (e) {
      print('SmartBuyer init error: $e');
      return false;
    }
  }

  /// بدء الكاميرا للتعرف على المنتجات
  Future<CameraController?> startCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) return null;

      _cameraController = CameraController(
        cameras.first,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await _cameraController!.initialize();
      _isCameraActive = true;

      return _cameraController;
    } catch (e) {
      print('Camera error: $e');
      return null;
    }
  }

  /// إيقاف الكاميرا
  Future<void> stopCamera() async {
    _isCameraActive = false;
    await _cameraController?.dispose();
    _cameraController = null;
  }

  /// التقاط صورة وتحليلها
  Future<List<RecognizedProduct>> captureAndAnalyze() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return [];
    }

    try {
      final image = await _cameraController!.takePicture();
      final products = await _analyzeImage(File(image.path));
      _recognizedProductsController.add(products);
      return products;
    } catch (e) {
      print('Capture error: $e');
      return [];
    }
  }

  /// تحليل الصورة باستخدام AI
  Future<List<RecognizedProduct>> _analyzeImage(File imageFile) async {
    try {
      final token = await _storage.read(key: 'auth_token');
      
      final dio = Dio(BaseOptions(
        baseUrl: _baseUrl,
        headers: {
          'Authorization': 'Bearer $token',
        },
      ));

      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          imageFile.path,
          filename: 'product_image.jpg',
        ),
      });

      final response = await dio.post(
        '/api/smart-buyer/analyze-image',
        data: formData,
      );

      if (response.data['success']) {
        final products = (response.data['data'] as List)
            .map((p) => RecognizedProduct.fromJson(p))
            .toList();
        return products;
      }

      return [];
    } catch (e) {
      print('Image analysis error: $e');
      return [];
    }
  }

  /// بدء الاستماع للأوامر الصوتية
  Future<void> startListening({
    required Function(String) onResult,
    String locale = 'ar-SA',
  }) async {
    if (_isListening) return;

    _isListening = true;

    await _speechToText.listen(
      onResult: (result) {
        if (result.finalResult) {
          final query = result.recognizedWords;
          _voiceQueryController.add(query);
          onResult(query);
          _processVoiceQuery(query);
        }
      },
      localeId: locale,
      listenMode: ListenMode.confirmation,
    );
  }

  /// إيقاف الاستماع
  Future<void> stopListening() async {
    _isListening = false;
    await _speechToText.stop();
  }

  /// معالجة الاستعلام الصوتي
  Future<List<RecognizedProduct>> _processVoiceQuery(String query) async {
    try {
      final token = await _storage.read(key: 'auth_token');
      
      final dio = Dio(BaseOptions(
        baseUrl: _baseUrl,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ));

      final response = await dio.post(
        '/api/smart-buyer/voice-search',
        data: {
          'query': query,
          'language': 'ar',
        },
      );

      if (response.data['success']) {
        final products = (response.data['data'] as List)
            .map((p) => RecognizedProduct.fromJson(p))
            .toList();
        _recognizedProductsController.add(products);
        return products;
      }

      return [];
    } catch (e) {
      print('Voice query error: $e');
      return [];
    }
  }

  /// البحث عن منتجات مشابهة
  Future<List<RecognizedProduct>> findSimilarProducts(String productId) async {
    try {
      final token = await _storage.read(key: 'auth_token');
      
      final dio = Dio(BaseOptions(
        baseUrl: _baseUrl,
        headers: {'Authorization': 'Bearer $token'},
      ));

      final response = await dio.get(
        '/api/smart-buyer/similar/$productId',
      );

      if (response.data['success']) {
        return (response.data['data'] as List)
            .map((p) => RecognizedProduct.fromJson(p))
            .toList();
      }

      return [];
    } catch (e) {
      print('Similar products error: $e');
      return [];
    }
  }

  /// الحصول على توصيات ذكية
  Future<List<RecognizedProduct>> getSmartRecommendations() async {
    try {
      final token = await _storage.read(key: 'auth_token');
      
      final dio = Dio(BaseOptions(
        baseUrl: _baseUrl,
        headers: {'Authorization': 'Bearer $token'},
      ));

      final response = await dio.get('/api/smart-buyer/recommendations');

      if (response.data['success']) {
        return (response.data['data'] as List)
            .map((p) => RecognizedProduct.fromJson(p))
            .toList();
      }

      return [];
    } catch (e) {
      print('Recommendations error: $e');
      return [];
    }
  }

  bool get isListening => _isListening;
  bool get isCameraActive => _isCameraActive;

  void dispose() {
    stopCamera();
    stopListening();
    _recognizedProductsController.close();
    _voiceQueryController.close();
  }
}

/// نموذج المنتج المُتعرف عليه
class RecognizedProduct {
  final String id;
  final String name;
  final String? nameAr;
  final String? description;
  final String? imageUrl;
  final double? price;
  final String? currency;
  final double confidence; // نسبة الثقة في التعرف
  final String? category;
  final String? brand;
  final List<String> tags;
  final bool isAvailable;
  final String? matchedListingId;

  RecognizedProduct({
    required this.id,
    required this.name,
    this.nameAr,
    this.description,
    this.imageUrl,
    this.price,
    this.currency,
    required this.confidence,
    this.category,
    this.brand,
    this.tags = const [],
    this.isAvailable = false,
    this.matchedListingId,
  });

  factory RecognizedProduct.fromJson(Map<String, dynamic> json) {
    return RecognizedProduct(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      nameAr: json['name_ar'],
      description: json['description'],
      imageUrl: json['image_url'],
      price: json['price']?.toDouble(),
      currency: json['currency'],
      confidence: (json['confidence'] ?? 0).toDouble(),
      category: json['category'],
      brand: json['brand'],
      tags: List<String>.from(json['tags'] ?? []),
      isAvailable: json['is_available'] ?? false,
      matchedListingId: json['matched_listing_id'],
    );
  }
}
