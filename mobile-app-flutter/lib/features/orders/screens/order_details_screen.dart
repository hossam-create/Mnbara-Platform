import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/orders_provider.dart';
import '../models/order_model.dart';

class OrderDetailsScreen extends ConsumerWidget {
  final String orderId;

  const OrderDetailsScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final orderAsync = ref.watch(orderDetailsProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: Text('${l10n.translate('order')} #$orderId')),
      body: orderAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (order) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatusTimeline(order, l10n),
              // Track Delivery Button for shipped orders
              if (order.status == OrderStatus.shipped && order.deliveryId != null)
                _buildTrackDeliveryButton(context, order, l10n),
              const SizedBox(height: 24),
              _buildSection(l10n.translate('items'), _buildItemsList(order, l10n)),
              const SizedBox(height: 16),
              _buildSection(l10n.translate('delivery_address'), _buildAddressCard(order, l10n)),
              const SizedBox(height: 16),
              _buildSection(l10n.translate('payment_summary'), _buildPaymentSummary(order, l10n)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusTimeline(Order order, AppLocalizations l10n) {
    final statuses = [OrderStatus.pending, OrderStatus.confirmed, OrderStatus.processing, OrderStatus.shipped, OrderStatus.delivered];
    final currentIndex = statuses.indexOf(order.status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: List.generate(statuses.length, (index) {
            final isCompleted = index <= currentIndex;
            final isCurrent = index == currentIndex;
            return Row(
              children: [
                Column(
                  children: [
                    Container(
                      width: 24, height: 24,
                      decoration: BoxDecoration(
                        color: isCompleted ? AppColors.success : AppColors.surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: isCompleted ? AppColors.success : AppColors.border, width: 2),
                      ),
                      child: isCompleted ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                    ),
                    if (index < statuses.length - 1)
                      Container(width: 2, height: 30, color: isCompleted ? AppColors.success : AppColors.border),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _getStatusText(statuses[index], l10n),
                    style: TextStyle(fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal, color: isCompleted ? AppColors.textPrimary : AppColors.textSecondary),
                  ),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  Widget _buildTrackDeliveryButton(BuildContext context, Order order, AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () => context.push('/tracking/${order.deliveryId}'),
          icon: const Icon(Icons.location_on),
          label: Text(l10n.translate('track_delivery')),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
    );
  }

  String _getStatusText(OrderStatus status, AppLocalizations l10n) {
    switch (status) {
      case OrderStatus.pending: return l10n.translate('pending');
      case OrderStatus.confirmed: return l10n.translate('confirmed');
      case OrderStatus.processing: return l10n.translate('processing');
      case OrderStatus.shipped: return l10n.translate('shipped');
      case OrderStatus.delivered: return l10n.translate('delivered');
      case OrderStatus.cancelled: return l10n.translate('cancelled');
    }
  }

  Widget _buildSection(String title, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        content,
      ],
    );
  }

  Widget _buildItemsList(Order order, AppLocalizations l10n) {
    return Card(
      child: Column(
        children: order.items.map((item) => ListTile(
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CachedNetworkImage(imageUrl: item.image, width: 50, height: 50, fit: BoxFit.cover),
          ),
          title: Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text('${l10n.translate('qty')}: ${item.quantity}'),
          trailing: Text('${item.total.toStringAsFixed(2)} ${l10n.translate('sar')}', style: const TextStyle(fontWeight: FontWeight.bold)),
        )).toList(),
      ),
    );
  }

  Widget _buildAddressCard(Order order, AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(order.shippingAddress.label, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(order.shippingAddress.fullAddress, style: TextStyle(color: AppColors.textSecondary)),
            Text(order.shippingAddress.phone, style: TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentSummary(Order order, AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildRow(l10n.translate('subtotal'), '${order.subtotal.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            _buildRow(l10n.translate('shipping'), order.shipping == 0 ? l10n.translate('free') : '${order.shipping.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            _buildRow(l10n.translate('vat'), '${order.tax.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            if (order.discount > 0) _buildRow(l10n.translate('discount'), '-${order.discount.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            const Divider(height: 24),
            _buildRow(l10n.translate('total'), '${order.total.toStringAsFixed(2)} ${l10n.translate('sar')}', isTotal: true),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isTotal ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontWeight: isTotal ? FontWeight.bold : FontWeight.normal, color: isTotal ? AppColors.primary : null)),
        ],
      ),
    );
  }
}
