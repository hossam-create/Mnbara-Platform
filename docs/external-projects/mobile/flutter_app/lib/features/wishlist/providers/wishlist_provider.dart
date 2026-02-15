import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../products/models/product_model.dart';

final wishlistProvider = StateNotifierProvider<WishlistNotifier, List<Product>>((ref) {
  return WishlistNotifier();
});

class WishlistNotifier extends StateNotifier<List<Product>> {
  WishlistNotifier() : super([]);

  bool isInWishlist(String productId) {
    return state.any((p) => p.id == productId);
  }

  void toggle(Product product) {
    if (isInWishlist(product.id)) {
      remove(product.id);
    } else {
      add(product);
    }
  }

  void add(Product product) {
    if (!isInWishlist(product.id)) {
      state = [...state, product];
    }
  }

  void remove(String productId) {
    state = state.where((p) => p.id != productId).toList();
  }

  void clear() {
    state = [];
  }
}
