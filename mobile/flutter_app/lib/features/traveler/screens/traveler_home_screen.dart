import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/traveler_provider.dart';
import '../models/trip_model.dart';

class TravelerHomeScreen extends ConsumerStatefulWidget {
  const TravelerHomeScreen({super.key});

  @override
  ConsumerState<TravelerHomeScreen> createState() => _TravelerHomeScreenState();
}

class _TravelerHomeScreenState extends ConsumerState<TravelerHomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(travelerProvider.notifier).fetchStats());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(travelerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('traveler_dashboard'))),
      body: RefreshIndicator(
        onRefresh: () => ref.read(travelerProvider.notifier).fetchStats(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Stats Cards
              Row(
                children: [
                  Expanded(child: _buildStatCard(l10n.translate('active_trips'), '${state.stats?.activeTrips ?? state.activeTrips.length}', AppColors.primary)),
                  const SizedBox(width: 12),
                  Expanded(child: _buildStatCard(l10n.translate('deliveries'), '${state.stats?.activeDeliveries ?? state.activeDeliveries.length}', AppColors.success)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => context.push('/traveler/earnings'),
                      child: _buildStatCard(l10n.translate('this_month'), '${state.stats?.monthlyEarnings.toStringAsFixed(0) ?? 0} ${l10n.translate('sar')}', AppColors.warning),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Quick Actions
              ElevatedButton(
                onPressed: () => context.push('/traveler/create-trip'),
                style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 56)),
                child: Text('+ ${l10n.translate('create_new_trip')}'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/traveler/nearby-requests'),
                      icon: const Icon(Icons.location_on),
                      label: Text(l10n.translate('nearby_requests')),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/traveler/earnings'),
                      icon: const Icon(Icons.attach_money),
                      label: Text(l10n.translate('earnings')),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Active Trips
              _buildSectionHeader(l10n.translate('active_trips'), () {}),
              if (state.isLoading && state.activeTrips.isEmpty)
                const Center(child: CircularProgressIndicator())
              else if (state.activeTrips.isEmpty)
                _buildEmptyState(l10n.translate('no_active_trips'), l10n.translate('create_trip_to_start'))
              else
                ...state.activeTrips.take(3).map((trip) => _buildTripCard(trip, l10n)),

              const SizedBox(height: 24),

              // Active Deliveries
              _buildSectionHeader(l10n.translate('active_deliveries'), () => context.push('/traveler/deliveries')),
              if (state.isLoading && state.activeDeliveries.isEmpty)
                const Center(child: CircularProgressIndicator())
              else if (state.activeDeliveries.isEmpty)
                _buildEmptyState(l10n.translate('no_active_deliveries'), l10n.translate('accept_requests_to_start'))
              else
                ...state.activeDeliveries.take(3).map((delivery) => _buildDeliveryCard(delivery, l10n)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 11, color: AppColors.textSecondary), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, VoidCallback onSeeAll) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        TextButton(onPressed: onSeeAll, child: Text(context.l10n.translate('see_all'))),
      ],
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(color: AppColors.textSecondary, fontSize: 14), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildTripCard(Trip trip, AppLocalizations l10n) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/traveler/trip/${trip.id}'),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Text(trip.origin, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('→', style: TextStyle(color: AppColors.textSecondary))),
                        Text(trip.destination, style: const TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  _buildStatusBadge(trip.status, _getTripStatusColor(trip.status)),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${_formatDate(trip.departureDate)} - ${_formatDate(trip.arrivalDate)}', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                  Text('${trip.usedCapacity}/${trip.availableCapacity} kg', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDeliveryCard(Delivery delivery, AppLocalizations l10n) {
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
                  Expanded(child: Text(delivery.productTitle, style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  _buildStatusBadge(_getDeliveryStatusLabel(delivery.status), _getDeliveryStatusColor(delivery.status)),
                ],
              ),
              const SizedBox(height: 8),
              Text('${l10n.translate('to')}: ${delivery.destination}', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
              Text('${l10n.translate('budget')}: ${delivery.earnings.toStringAsFixed(2)} ${l10n.translate('sar')}', style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500)),
    );
  }

  String _formatDate(DateTime date) => '${date.day}/${date.month}';

  Color _getTripStatusColor(String status) {
    switch (status) {
      case 'scheduled': return AppColors.primary;
      case 'active':
      case 'in_progress': return AppColors.success;
      case 'completed': return AppColors.textSecondary;
      case 'cancelled': return AppColors.error;
      default: return AppColors.primary;
    }
  }

  Color _getDeliveryStatusColor(String status) {
    switch (status) {
      case 'proposed': return AppColors.warning;
      case 'accepted': return AppColors.primary;
      case 'picked_up': return AppColors.info;
      case 'delivered': return AppColors.success;
      case 'completed': return AppColors.textSecondary;
      case 'cancelled': return AppColors.error;
      default: return AppColors.primary;
    }
  }

  String _getDeliveryStatusLabel(String status) {
    switch (status) {
      case 'proposed': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
}
