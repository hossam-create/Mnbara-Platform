import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/traveler_provider.dart';

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final state = ref.watch(travelerProvider);
    final stats = state.stats;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('earnings'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Total Earnings Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryLight]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(l10n.translate('total_earnings'), style: TextStyle(color: Colors.white.withOpacity(0.8))),
                  const SizedBox(height: 8),
                  Text('${stats?.totalEarnings.toStringAsFixed(2) ?? 0} ${l10n.translate('sar')}', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Stats Grid
            Row(
              children: [
                Expanded(child: _buildStatCard(l10n.translate('this_month'), '${stats?.monthlyEarnings.toStringAsFixed(0) ?? 0} ${l10n.translate('sar')}', Icons.calendar_today, AppColors.success)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard(l10n.translate('completed'), '${stats?.completedDeliveries ?? 0}', Icons.check_circle_outline, AppColors.primary)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildStatCard(l10n.translate('rating'), '${stats?.rating.toStringAsFixed(1) ?? 0} ⭐', Icons.star_outline, AppColors.warning)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard(l10n.translate('pending'), '${stats?.pendingRequests ?? 0}', Icons.pending_outlined, AppColors.info)),
              ],
            ),
            const SizedBox(height: 24),

            // Recent Transactions
            Text(l10n.translate('recent_transactions'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildTransactionItem('iPhone 15 Pro', '+450 ${l10n.translate('sar')}', 'Dec 20, 2024', true),
            _buildTransactionItem('MacBook Air', '+320 ${l10n.translate('sar')}', 'Dec 18, 2024', true),
            _buildTransactionItem('AirPods Pro', '+85 ${l10n.translate('sar')}', 'Dec 15, 2024', true),
            _buildTransactionItem(l10n.translate('withdrawal'), '-500 ${l10n.translate('sar')}', 'Dec 10, 2024', false),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(String title, String amount, String date, bool isEarning) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: (isEarning ? AppColors.success : AppColors.error).withOpacity(0.1), shape: BoxShape.circle),
            child: Icon(isEarning ? Icons.arrow_downward : Icons.arrow_upward, color: isEarning ? AppColors.success : AppColors.error, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
                Text(date, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Text(amount, style: TextStyle(fontWeight: FontWeight.bold, color: isEarning ? AppColors.success : AppColors.error)),
        ],
      ),
    );
  }
}
