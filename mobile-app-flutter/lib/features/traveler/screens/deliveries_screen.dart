import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/traveler_provider.dart';
import '../models/trip_model.dart';

class DeliveriesScreen extends ConsumerStatefulWidget {
  const DeliveriesScreen({super.key});

  @override
  ConsumerState<DeliveriesScreen> createState() => _DeliveriesScreenState();
}

class _DeliveriesScreenState extends ConsumerState<DeliveriesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    Future.microtask(() => ref.read(travelerProvider.notifier).loadDeliveries());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(travelerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('deliveries')),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: l10n.translate('all')),
            Tab(text: l10n.translate('active')),
            Tab(text: l10n.translate('completed')),
          ],
        ),
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildDeliveryList(state.deliveries, l10n),
                _buildDeliveryList(state.deliveries.where((d) => !['completed', 'cancelled'].contains(d.status)).toList(), l10n),
                _buildDeliveryList(state.deliveries.where((d) => ['completed', 'cancelled'].contains(d.status)).toList(), l10n),
              ],
            ),
    );
  }

  Widget _buildDeliveryList(List<Delivery> deliveries, AppLocalizations l10n) {
    if (deliveries.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('📦', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 16),
            Text(l10n.translate('no_deliveries'), style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(l10n.translate('accept_requests_to_start'), style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.push('/traveler/nearby-requests'),
              child: Text(l10n.translate('find_requests')),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(travelerProvider.notifier).loadDeliveries(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: deliveries.length,
        itemBuilder: (context, index) => _DeliveryCard(delivery: deliveries[index]),
      ),
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  final Delivery delivery;

  const _DeliveryCard({required this.delivery});

  Color _getStatusColor() {
    switch (delivery.status) {
      case 'proposed': return Colors.orange;
      case 'accepted': return Colors.blue;
      case 'picked_up': return Colors.purple;
      case 'delivered': return Colors.green;
      case 'completed': return Colors.grey;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _getStatusLabel(AppLocalizations l10n) {
    switch (delivery.status) {
      case 'proposed': return l10n.translate('pending');
      case 'accepted': return l10n.translate('ready_for_pickup');
      case 'picked_up': return l10n.translate('in_transit');
      case 'delivered': return l10n.translate('awaiting_confirmation');
      case 'completed': return l10n.translate('completed');
      case 'cancelled': return l10n.translate('cancelled');
      default: return delivery.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/traveler/delivery/${delivery.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: delivery.productImage != null
                        ? CachedNetworkImage(
                            imageUrl: delivery.productImage!,
                            width: 70,
                            height: 70,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            width: 70,
                            height: 70,
                            color: AppColors.surface,
                            child: const Center(child: Text('📦', style: TextStyle(fontSize: 28))),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          delivery.productTitle,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${delivery.origin} → ${delivery.destination}',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor().withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _getStatusLabel(l10n),
                            style: TextStyle(color: _getStatusColor(), fontSize: 12, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.translate('earnings'), style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                      Text(
                        '${delivery.earnings.toStringAsFixed(2)} ${l10n.translate('sar')}',
                        style: const TextStyle(color: AppColors.success, fontSize: 18, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  if (!['completed', 'cancelled'].contains(delivery.status))
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        delivery.status == 'accepted' 
                            ? '${l10n.translate('mark_as_picked_up')} →'
                            : delivery.status == 'picked_up'
                                ? '${l10n.translate('mark_as_delivered')} →'
                                : l10n.translate('view_details'),
                        style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
