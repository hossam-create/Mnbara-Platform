import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/orders_provider.dart';
import '../models/order_model.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final ordersAsync = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('my_orders'))),
      body: ordersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (orders) {
          if (orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_outlined, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
                  const SizedBox(height: 24),
                  Text(l10n.translate('no_orders'), style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(l10n.translate('no_orders_desc'), style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            itemBuilder: (context, index) => _buildOrderCard(context, orders[index], l10n),
          );
        },
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, Order order, AppLocalizations l10n) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/order/${order.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('#${order.id}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  _buildStatusChip(order.status, l10n),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.calendar_today_outlined, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 8),
                  Text(timeago.format(order.createdAt), style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.shopping_bag_outlined, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 8),
                  Text('${order.items.length} ${l10n.translate('items')}', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                ],
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l10n.translate('total')),
                  Text('${order.total.toStringAsFixed(2)} ${l10n.translate('sar')}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(OrderStatus status, AppLocalizations l10n) {
    Color color;
    String text;
    switch (status) {
      case OrderStatus.pending:
        color = AppColors.warning;
        text = l10n.translate('pending');
        break;
      case OrderStatus.confirmed:
        color = AppColors.info;
        text = l10n.translate('confirmed');
        break;
      case OrderStatus.processing:
        color = AppColors.info;
        text = l10n.translate('processing');
        break;
      case OrderStatus.shipped:
        color = AppColors.primary;
        text = l10n.translate('shipped');
        break;
      case OrderStatus.delivered:
        color = AppColors.success;
        text = l10n.translate('delivered');
        break;
      case OrderStatus.cancelled:
        color = AppColors.error;
        text = l10n.translate('cancelled');
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
