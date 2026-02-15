import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../products/models/product_model.dart';

final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>((ref) {
  return SearchNotifier(ref.read(apiClientProvider));
});

final recentSearchesProvider = StateNotifierProvider<RecentSearchesNotifier, List<String>>((ref) {
  return RecentSearchesNotifier();
});

class SearchState {
  final String query;
  final List<Product> results;
  final bool isLoading;
  final String? error;

  SearchState({
    this.query = '',
    this.results = const [],
    this.isLoading = false,
    this.error,
  });

  SearchState copyWith({
    String? query,
    List<Product>? results,
    bool? isLoading,
    String? error,
  }) {
    return SearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class SearchNotifier extends StateNotifier<SearchState> {
  final ApiClient _apiClient;

  SearchNotifier(this._apiClient) : super(SearchState());

  Future<void> search(String query) async {
    if (query.isEmpty) return;

    state = state.copyWith(query: query, isLoading: true);
    try {
      final response = await _apiClient.get('/products/search', queryParameters: {'q': query});
      final products = (response.data['products'] as List).map((e) => Product.fromJson(e)).toList();
      state = state.copyWith(results: products, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  void clear() {
    state = SearchState();
  }
}

class RecentSearchesNotifier extends StateNotifier<List<String>> {
  RecentSearchesNotifier() : super([]) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getStringList('recent_searches') ?? [];
  }

  Future<void> add(String query) async {
    if (state.contains(query)) {
      state = [query, ...state.where((q) => q != query)];
    } else {
      state = [query, ...state.take(9)];
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('recent_searches', state);
  }

  Future<void> remove(String query) async {
    state = state.where((q) => q != query).toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('recent_searches', state);
  }

  Future<void> clear() async {
    state = [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('recent_searches');
  }
}
