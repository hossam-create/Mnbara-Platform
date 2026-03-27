import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../products/models/product_model.dart';

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});

class CartItem {
  final Product product;
  final int quantity;

  CartItem({required this.product, required this.quantity});

  double get total => product.price * quantity;

  CartItem copyWith({Product? product, int? quantity}) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }
}

class CartState {
  final List<CartItem> items;
  final String? couponCode;
  final double discount;

  CartState({
    this.items = const [],
    this.couponCode,
    this.discount = 0,
  });

  double get subtotal => items.fold(0, (sum, item) => sum + item.total);
  double get shipping => subtotal > 200 ? 0 : 25; // Free shipping over 200 SAR
  double get tax => subtotal * 0.15; // 15% VAT
  double get total => subtotal + shipping + tax - discount;
  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  CartState copyWith({
    List<CartItem>? items,
    String? couponCode,
    double? discount,
  }) {
    return CartState(
      items: items ?? this.items,
      couponCode: couponCode ?? this.couponCode,
      discount: discount ?? this.discount,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  void addItem(Product product, [int quantity = 1]) {
    final existingIndex = state.items.indexWhere((item) => item.product.id == product.id);
    
    if (existingIndex != -1) {
      final updatedItems = [...state.items];
      updatedItems[existingIndex] = updatedItems[existingIndex].copyWith(
        quantity: updatedItems[existingIndex].quantity + quantity,
      );
      state = state.copyWith(items: updatedItems);
    } else {
      state = state.copyWith(
        items: [...state.items, CartItem(product: product, quantity: quantity)],
      );
    }
  }

  void removeItem(String productId) {
    state = state.copyWith(
      items: state.items.where((item) => item.product.id != productId).toList(),
    );
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    final updatedItems = state.items.map((item) {
      if (item.product.id == productId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();

    state = state.copyWith(items: updatedItems);
  }

  void incrementQuantity(String productId) {
    final item = state.items.firstWhere((item) => item.product.id == productId);
    if (item.quantity < item.product.stock) {
      updateQuantity(productId, item.quantity + 1);
    }
  }

  void decrementQuantity(String productId) {
    final item = state.items.firstWhere((item) => item.product.id == productId);
    updateQuantity(productId, item.quantity - 1);
  }

  void applyCoupon(String code, double discountAmount) {
    state = state.copyWith(couponCode: code, discount: discountAmount);
  }

  void removeCoupon() {
    state = state.copyWith(couponCode: null, discount: 0);
  }

  void clearCart() {
    state = CartState();
  }
}
