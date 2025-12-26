import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/smart_buyer_service.dart';

// Service Provider
final smartBuyerServiceProvider = Provider<SmartBuyerService>((ref) {
  final service = SmartBuyerService();
  ref.onDispose(() => service.dispose());
  return service;
});

// State
class SmartBuyerState {
  final List<RecognizedProduct> recognizedProducts;
  final bool isAnalyzing;
  final bool isListening;
  final String? lastVoiceQuery;
  final String? error;

  const SmartBuyerState({
    this.recognizedProducts = const [],
    this.isAnalyzing = false,
    this.isListening = false,
    this.lastVoiceQuery,
    this.error,
  });

  SmartBuyerState copyWith({
    List<RecognizedProduct>? recognizedProducts,
    bool? isAnalyzing,
    bool? isListening,
    String? lastVoiceQuery,
    String? error,
  }) {
    return SmartBuyerState(
      recognizedProducts: recognizedProducts ?? this.recognizedProducts,
      isAnalyzing: isAnalyzing ?? this.isAnalyzing,
      isListening: isListening ?? this.isListening,
      lastVoiceQuery: lastVoiceQuery ?? this.lastVoiceQuery,
      error: error,
    );
  }
}

// Notifier
class SmartBuyerNotifier extends StateNotifier<SmartBuyerState> {
  final SmartBuyerService _service;

  SmartBuyerNotifier(this._service) : super(const SmartBuyerState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    await _service.initialize();
    
    // Listen to recognized products
    _service.recognizedProducts.listen((products) {
      state = state.copyWith(
        recognizedProducts: products,
        isAnalyzing: false,
      );
    });

    // Listen to voice queries
    _service.voiceQueries.listen((query) {
      state = state.copyWith(lastVoiceQuery: query);
    });
  }

  Future<void> captureAndAnalyze() async {
    state = state.copyWith(isAnalyzing: true, error: null);
    
    try {
      await _service.captureAndAnalyze();
    } catch (e) {
      state = state.copyWith(
        isAnalyzing: false,
        error: e.toString(),
      );
    }
  }

  void startListening() {
    state = state.copyWith(isListening: true);
    _service.startListening(
      onResult: (query) {
        state = state.copyWith(lastVoiceQuery: query);
      },
    );
  }

  void stopListening() {
    state = state.copyWith(isListening: false);
    _service.stopListening();
  }

  Future<void> findSimilar(String productId) async {
    state = state.copyWith(isAnalyzing: true);
    
    try {
      final products = await _service.findSimilarProducts(productId);
      state = state.copyWith(
        recognizedProducts: products,
        isAnalyzing: false,
      );
    } catch (e) {
      state = state.copyWith(
        isAnalyzing: false,
        error: e.toString(),
      );
    }
  }

  void clearResults() {
    state = state.copyWith(
      recognizedProducts: [],
      lastVoiceQuery: null,
      error: null,
    );
  }
}

// Provider
final smartBuyerProvider =
    StateNotifierProvider<SmartBuyerNotifier, SmartBuyerState>((ref) {
  final service = ref.watch(smartBuyerServiceProvider);
  return SmartBuyerNotifier(service);
});
