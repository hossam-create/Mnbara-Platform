import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../models/order_model.dart';

final ordersProvider = FutureProvider<List<Order>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get('/orders');
  return (response.data['orders'] as List).map((e) => Order.fromJson(e)).toList();
});

final orderDetailsProvider = FutureProvider.family<Order, String>((ref, orderId) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get('/orders/$orderId');
  return Order.fromJson(response.data);
});
