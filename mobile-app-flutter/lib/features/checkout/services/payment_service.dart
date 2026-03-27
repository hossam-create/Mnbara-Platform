import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../cart/providers/cart_provider.dart';

final paymentServiceProvider = Provider<PaymentService>((ref) {
  return PaymentService(ref.read(apiClientProvider));
});

class PaymentService {
  final ApiClient _apiClient;

  PaymentService(this._apiClient);

  Future<String> createPaymentIntent(double amount) async {
    final response = await _apiClient.post('/payments/create-intent', data: {
      'amount': (amount * 100).toInt(), // Convert to cents
      'currency': 'sar',
    });
    return response.data['clientSecret'];
  }

  Future<String> createOrder(CartState cart) async {
    final response = await _apiClient.post('/orders', data: {
      'items': cart.items.map((item) => {
        'productId': item.product.id,
        'quantity': item.quantity,
        'price': item.product.price,
      }).toList(),
      'subtotal': cart.subtotal,
      'shipping': cart.shipping,
      'tax': cart.tax,
      'discount': cart.discount,
      'total': cart.total,
      'couponCode': cart.couponCode,
    });
    return response.data['orderId'];
  }

  Future<void> verifyPayment(String paymentIntentId) async {
    await _apiClient.post('/payments/verify', data: {'paymentIntentId': paymentIntentId});
  }
}
