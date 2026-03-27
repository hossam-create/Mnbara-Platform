import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';

class SellerDashboardScreen extends ConsumerWidget {
  const SellerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('seller_dashboard'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatsGrid(l10n),
            const SizedBox(height: 24),
            _buildQuickActions(context, l10n),
            const SizedBox(height: 24),
            _buildRecentOrders(l10n),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/seller/create-listing'),
        icon: const Icon(Icons.add),
        label: Text(l10n.translate('new_listing')),
      ),
    );
  }

  Widget _buildStatsGrid(AppLocalizations l10n) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(l10n.translate('total_sales'), '12,450 ${l10n.translate('sar')}', Icons.attach_money, AppColors.success),
        _buildStatCard(l10n.translate('orders'), '156', Icons.shopping_bag_outlined, AppColors.primary),
        _buildStatCard(l10n.translate('products'), '24', Icons.inventory_2_outlined, AppColors.info),
        _buildStatCard(l10n.translate('views'), '3,240', Icons.visibility_outlined, AppColors.warning),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              Text(title, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.translate('quick_actions'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildActionButton(context, Icons.list_alt, l10n.translate('my_listings'), () => context.push('/seller/listings'))),
            const SizedBox(width: 12),
            Expanded(child: _buildActionButton(context, Icons.analytics_outlined, l10n.translate('analytics'), () {})),
            const SizedBox(width: 12),
            Expanded(child: _buildActionButton(context, Icons.settings_outlined, l10n.translate('settings'), () {})),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 12), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentOrders(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l10n.translate('recent_orders'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton(onPressed: () {}, child: Text(l10n.translate('view_all'))),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              _buildOrderItem('#12345', 'iPhone 15 Pro', '4,500 ${l10n.translate('sar')}', l10n.translate('pending')),
              const Divider(height: 1),
              _buildOrderItem('#12344', 'MacBook Air M2', '5,200 ${l10n.translate('sar')}', l10n.translate('shipped')),
              const Divider(height: 1),
              _buildOrderItem('#12343', 'AirPods Pro', '950 ${l10n.translate('sar')}', l10n.translate('delivered')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOrderItem(String orderId, String product, String amount, String status) {
    return ListTile(
      title: Text(product),
      subtitle: Text(orderId),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(amount, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(status, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }
}
