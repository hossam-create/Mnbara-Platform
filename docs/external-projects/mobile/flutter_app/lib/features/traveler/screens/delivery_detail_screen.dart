import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/traveler_provider.dart';
import '../models/trip_model.dart';
import '../services/traveler_location_service.dart';

class DeliveryDetailScreen extends ConsumerStatefulWidget {
  final String deliveryId;

  const DeliveryDetailScreen({super.key, required this.deliveryId});

  @override
  ConsumerState<DeliveryDetailScreen> createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends ConsumerState<DeliveryDetailScreen> {
  final _locationService = TravelerLocationService();
  
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(travelerProvider.notifier).loadDeliveryDetail(widget.deliveryId));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(travelerProvider);
    final delivery = state.selectedDelivery;

    if (state.isLoading || delivery == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.translate('delivery_detail'))),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final isCancelled = delivery.status == 'cancelled';
    final isCompleted = delivery.status == 'completed';

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('delivery_detail'))),
      body: RefreshIndicator(
        onRefresh: () => ref.read(travelerProvider.notifier).loadDeliveryDetail(widget.deliveryId),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildProductSection(delivery, l10n),
              // Location sharing indicator for picked_up status
              if (delivery.status == 'picked_up' || delivery.status == 'in_transit')
                _buildLocationSharingIndicator(l10n),
              _buildRouteSection(delivery, l10n),
              _buildEarningsSection(delivery, l10n),
              _buildTimelineSection(delivery, l10n, isCancelled),
              if (delivery.deadline != null) _buildDeadlineSection(delivery, l10n),
              if (!isCancelled && !isCompleted) _buildActionsSection(delivery, l10n),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProductSection(Delivery delivery, AppLocalizations l10n) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: delivery.productImage != null
                ? CachedNetworkImage(imageUrl: delivery.productImage!, width: 100, height: 100, fit: BoxFit.cover)
                : Container(width: 100, height: 100, color: AppColors.surface, child: const Center(child: Text('📦', style: TextStyle(fontSize: 40)))),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(delivery.productTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text(delivery.productDescription ?? '', style: TextStyle(color: AppColors.textSecondary, fontSize: 14), maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationSharingIndicator(AppLocalizations l10n) {
    final isSharing = _locationService.isSharing && _locationService.activeDeliveryId == widget.deliveryId;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isSharing ? AppColors.success.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSharing ? AppColors.success.withOpacity(0.3) : Colors.orange.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isSharing ? Icons.location_on : Icons.location_off,
            color: isSharing ? AppColors.success : Colors.orange,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isSharing 
                      ? l10n.translate('live_tracking')
                      : l10n.translate('location_unavailable'),
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: isSharing ? AppColors.success : Colors.orange,
                  ),
                ),
                Text(
                  isSharing 
                      ? l10n.translate('buyer_can_track')
                      : l10n.translate('enable_location'),
                  style: TextStyle(
                    fontSize: 12,
                    color: isSharing ? AppColors.success.withOpacity(0.8) : Colors.orange.withOpacity(0.8),
                  ),
                ),
              ],
            ),
          ),
          if (!isSharing)
            TextButton(
              onPressed: () async {
                await _locationService.startSharing(widget.deliveryId);
                setState(() {});
              },
              child: Text(l10n.translate('enable')),
            ),
        ],
      ),
    );
  }

  Widget _buildRouteSection(Delivery delivery, AppLocalizations l10n) {
    return _buildSection(
      l10n.translate('route'),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            _buildRoutePoint(l10n.translate('pickup'), delivery.origin, Colors.blue),
            Container(width: 2, height: 24, color: AppColors.border, margin: const EdgeInsets.only(left: 5)),
            _buildRoutePoint(l10n.translate('delivery'), delivery.destination, Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildRoutePoint(String label, String value, Color color) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
          ],
        ),
      ],
    );
  }

  Widget _buildEarningsSection(Delivery delivery, AppLocalizations l10n) {
    return _buildSection(
      l10n.translate('earnings'),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l10n.translate('delivery_fee'), style: TextStyle(color: AppColors.textSecondary)),
                Text('${delivery.earnings.toStringAsFixed(2)} ${l10n.translate('sar')}'),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l10n.translate('total_earnings'), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                Text('${delivery.earnings.toStringAsFixed(2)} ${l10n.translate('sar')}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 20)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineSection(Delivery delivery, AppLocalizations l10n, bool isCancelled) {
    final steps = [
      {'status': 'proposed', 'label': l10n.translate('request_accepted'), 'icon': '✓'},
      {'status': 'accepted', 'label': l10n.translate('ready_for_pickup'), 'icon': '📍'},
      {'status': 'picked_up', 'label': l10n.translate('picked_up'), 'icon': '📦'},
      {'status': 'delivered', 'label': l10n.translate('delivered'), 'icon': '🚚'},
      {'status': 'completed', 'label': l10n.translate('completed'), 'icon': '✅'},
    ];

    final statusOrder = {'proposed': 0, 'accepted': 1, 'picked_up': 2, 'delivered': 3, 'completed': 4, 'cancelled': -1};
    final currentOrder = statusOrder[delivery.status] ?? -1;

    return _buildSection(
      l10n.translate('status_timeline'),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: isCancelled
            ? Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('❌', style: TextStyle(fontSize: 24)),
                    const SizedBox(width: 8),
                    Text(l10n.translate('cancelled'), style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w500, fontSize: 16)),
                  ],
                ),
              )
            : Column(
                children: steps.asMap().entries.map((entry) {
                  final index = entry.key;
                  final step = entry.value;
                  final stepOrder = statusOrder[step['status']] ?? 0;
                  final isCompleted = stepOrder < currentOrder;
                  final isCurrent = stepOrder == currentOrder;
                  final isLast = index == steps.length - 1;

                  return _buildTimelineStep(step, isCompleted, isCurrent, isLast);
                }).toList(),
              ),
      ),
    );
  }

  Widget _buildTimelineStep(Map<String, String> step, bool isCompleted, bool isCurrent, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isCompleted ? AppColors.success : isCurrent ? AppColors.primary : AppColors.surface,
                shape: BoxShape.circle,
              ),
              child: Center(child: Text(step['icon']!, style: const TextStyle(fontSize: 14))),
            ),
            if (!isLast) Container(width: 2, height: 24, color: isCompleted ? AppColors.success : AppColors.border),
          ],
        ),
        const SizedBox(width: 12),
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            step['label']!,
            style: TextStyle(
              color: isCompleted ? AppColors.success : isCurrent ? AppColors.primary : AppColors.textSecondary,
              fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDeadlineSection(Delivery delivery, AppLocalizations l10n) {
    return _buildSection(
      l10n.translate('deliver_by'),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            const Text('⏰', style: TextStyle(fontSize: 24)),
            const SizedBox(width: 12),
            Text(delivery.deadline!.toString().split(' ')[0], style: const TextStyle(fontSize: 14)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionsSection(Delivery delivery, AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (delivery.status == 'accepted')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => context.push('/traveler/evidence/${delivery.id}?type=pickup'),
                icon: const Text('📷'),
                label: Text(l10n.translate('mark_as_picked_up')),
              ),
            ),
          if (delivery.status == 'picked_up')
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => context.push('/traveler/evidence/${delivery.id}?type=delivery'),
                icon: const Text('📷'),
                label: Text(l10n.translate('mark_as_delivered')),
              ),
            ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Text('💬'),
              label: Text(l10n.translate('contact_buyer')),
            ),
          ),
          if (['proposed', 'accepted'].contains(delivery.status)) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => _showCancelDialog(l10n),
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
                child: Text(l10n.translate('cancel_delivery')),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSection(String title, Widget child) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: AppColors.textSecondary, fontSize: 14, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }

  void _showCancelDialog(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translate('cancel_delivery')),
        content: Text(l10n.translate('cancel_delivery_confirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.translate('cancel'))),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(travelerProvider.notifier).cancelDelivery(widget.deliveryId);
              context.pop();
            },
            child: Text(l10n.translate('cancel_delivery'), style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
