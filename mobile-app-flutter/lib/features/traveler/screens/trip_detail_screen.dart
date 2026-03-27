import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/traveler_provider.dart';
import '../models/trip_model.dart';

class TripDetailScreen extends ConsumerStatefulWidget {
  final String tripId;

  const TripDetailScreen({super.key, required this.tripId});

  @override
  ConsumerState<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends ConsumerState<TripDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(travelerProvider.notifier).loadTripDetail(widget.tripId));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final state = ref.watch(travelerProvider);
    final trip = state.selectedTrip;

    if (state.isLoading || trip == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.translate('trip_detail'))),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('trip_detail')),
        actions: [
          if (trip.status == 'active')
            IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _showCancelDialog(l10n)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(travelerProvider.notifier).loadTripDetail(widget.tripId),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _buildRouteCard(trip, l10n),
            const SizedBox(height: 16),
            _buildDetailsCard(trip, l10n),
            const SizedBox(height: 16),
            _buildMatchedRequestsSection(trip, l10n),
          ]),
        ),
      ),
    );
  }

  Widget _buildRouteCard(Trip trip, AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.translate('route'), style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Row(
              children: [
                Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle)),
                const SizedBox(width: 12),
                Expanded(child: Text(trip.origin, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))),
              ],
            ),
            Container(width: 2, height: 24, color: AppColors.border, margin: const EdgeInsets.only(left: 5)),
            Row(
              children: [
                Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                const SizedBox(width: 12),
                Expanded(child: Text(trip.destination, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsCard(Trip trip, AppLocalizations l10n) {
    final duration = trip.arrivalDate.difference(trip.departureDate).inDays;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildDetailRow(l10n.translate('departure_date'), trip.departureDate.toString().split(' ')[0]),
            const Divider(height: 24),
            _buildDetailRow(l10n.translate('arrival_date'), trip.arrivalDate.toString().split(' ')[0]),
            const Divider(height: 24),
            _buildDetailRow(l10n.translate('duration'), '$duration ${l10n.translate('days')}'),
            const Divider(height: 24),
            _buildDetailRow(l10n.translate('capacity_used'), '${trip.usedCapacity}/${trip.availableCapacity} kg'),
            const Divider(height: 24),
            _buildDetailRow(l10n.translate('potential_earnings'), '${trip.potentialEarnings.toStringAsFixed(2)} ${l10n.translate('sar')}', isHighlight: true),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isHighlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: AppColors.textSecondary)),
        Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: isHighlight ? AppColors.success : null, fontSize: isHighlight ? 18 : 14)),
      ],
    );
  }

  Widget _buildMatchedRequestsSection(Trip trip, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.translate('matched_requests'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (trip.matchedRequests.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  children: [
                    const Text('📦', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: 8),
                    Text(l10n.translate('no_nearby_requests'), style: TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ),
          )
        else
          ...trip.matchedRequests.map((request) => Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: const CircleAvatar(child: Text('📦')),
              title: Text(request['title'] ?? 'Request'),
              subtitle: Text('${request['budget']?.toStringAsFixed(2) ?? '0.00'} ${l10n.translate('sar')}'),
              trailing: ElevatedButton(onPressed: () {}, child: Text(l10n.translate('make_offer'))),
            ),
          )),
      ],
    );
  }

  void _showCancelDialog(AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translate('cancel_trip')),
        content: Text(l10n.translate('cancel_delivery_confirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.translate('cancel'))),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(travelerProvider.notifier).cancelTrip(widget.tripId);
              context.pop();
            },
            child: Text(l10n.translate('cancel_trip'), style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
