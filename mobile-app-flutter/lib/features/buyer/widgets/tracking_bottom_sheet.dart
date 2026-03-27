import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../models/traveler_location_model.dart';

class TrackingBottomSheet extends StatelessWidget {
  final TravelerLocation location;
  final ConnectionStatus connectionStatus;
  final DateTime? lastUpdate;
  final VoidCallback? onRefresh;

  const TrackingBottomSheet({
    super.key,
    required this.location,
    required this.connectionStatus,
    this.lastUpdate,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    
    return DraggableScrollableSheet(
      initialChildSize: 0.35,
      minChildSize: 0.15,
      maxChildSize: 0.7,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(
                color: Colors.black12,
                blurRadius: 10,
                offset: Offset(0, -2),
              ),
            ],
          ),
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.zero,
            children: [
              _buildDragHandle(),
              _buildConnectionStatus(l10n),
              _buildTravelerInfo(l10n),
              _buildEtaSection(l10n),
              _buildQuickActions(context, l10n),
              _buildTimeline(l10n),
              if (location.productTitle != null) _buildProductInfo(l10n),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDragHandle() {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 12),
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: Colors.grey[300],
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildConnectionStatus(AppLocalizations l10n) {
    if (connectionStatus == ConnectionStatus.connected) {
      return const SizedBox.shrink();
    }

    Color bgColor;
    String message;
    IconData icon;

    switch (connectionStatus) {
      case ConnectionStatus.reconnecting:
        bgColor = Colors.orange.shade100;
        message = l10n.translate('reconnecting');
        icon = Icons.sync;
        break;
      case ConnectionStatus.disconnected:
      case ConnectionStatus.error:
        bgColor = Colors.red.shade100;
        message = l10n.translate('connection_lost');
        icon = Icons.cloud_off;
        break;
      default:
        bgColor = Colors.blue.shade100;
        message = l10n.translate('connecting');
        icon = Icons.cloud_sync;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey[700]),
          const SizedBox(width: 8),
          Text(message, style: TextStyle(color: Colors.grey[700], fontSize: 13)),
          const Spacer(),
          if (lastUpdate != null)
            Text(
              _formatLastUpdate(l10n),
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
        ],
      ),
    );
  }

  String _formatLastUpdate(AppLocalizations l10n) {
    if (lastUpdate == null) return '';
    final diff = DateTime.now().difference(lastUpdate!);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    return '${diff.inHours}h';
  }

  Widget _buildTravelerInfo(AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: AppColors.surface,
            backgroundImage: location.travelerPhoto != null
                ? CachedNetworkImageProvider(location.travelerPhoto!)
                : null,
            child: location.travelerPhoto == null
                ? const Icon(Icons.person, size: 28, color: AppColors.textSecondary)
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  location.travelerName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _getStatusColor(location.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getStatusText(location.status, l10n),
                        style: TextStyle(
                          color: _getStatusColor(location.status),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    if (location.travelerRating != null) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.star, size: 14, color: Colors.amber),
                      const SizedBox(width: 2),
                      Text(
                        location.travelerRating!.toStringAsFixed(1),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEtaSection(AppLocalizations l10n) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildEtaItem(
            icon: Icons.access_time,
            label: l10n.translate('eta'),
            value: location.eta != null
                ? '${location.eta!.inMinutes} ${l10n.translate('min')}'
                : '--',
          ),
          Container(width: 1, height: 40, color: AppColors.border),
          _buildEtaItem(
            icon: Icons.route,
            label: l10n.translate('distance'),
            value: location.distanceRemaining != null
                ? '${(location.distanceRemaining! / 1000).toStringAsFixed(1)} ${l10n.translate('km')}'
                : '--',
          ),
        ],
      ),
    );
  }

  Widget _buildEtaItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 24),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildActionButton(
              icon: Icons.phone,
              label: l10n.translate('call'),
              onTap: () => _callTraveler(),
              color: Colors.green,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildActionButton(
              icon: Icons.message,
              label: l10n.translate('message'),
              onTap: () => _messageTraveler(),
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildActionButton(
              icon: Icons.navigation,
              label: l10n.translate('navigate'),
              onTap: () => _navigateToDestination(),
              color: Colors.orange,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color color,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline(AppLocalizations l10n) {
    final steps = [
      {'status': 'picked_up', 'label': l10n.translate('picked_up'), 'icon': Icons.inventory_2},
      {'status': 'in_transit', 'label': l10n.translate('in_transit'), 'icon': Icons.local_shipping},
      {'status': 'delivered', 'label': l10n.translate('delivered'), 'icon': Icons.check_circle},
    ];

    final statusOrder = {'picked_up': 0, 'in_transit': 1, 'delivered': 2, 'completed': 3};
    final currentOrder = statusOrder[location.status] ?? 1;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.translate('delivery_progress'),
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 12),
          Row(
            children: steps.asMap().entries.map((entry) {
              final index = entry.key;
              final step = entry.value;
              final stepOrder = statusOrder[step['status']] ?? 0;
              final isCompleted = stepOrder <= currentOrder;
              final isLast = index == steps.length - 1;

              return Expanded(
                child: Row(
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: isCompleted ? AppColors.success : AppColors.surface,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            step['icon'] as IconData,
                            size: 16,
                            color: isCompleted ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          step['label'] as String,
                          style: TextStyle(
                            fontSize: 10,
                            color: isCompleted ? AppColors.success : AppColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                    if (!isLast)
                      Expanded(
                        child: Container(
                          height: 2,
                          margin: const EdgeInsets.only(bottom: 20),
                          color: isCompleted ? AppColors.success : AppColors.border,
                        ),
                      ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildProductInfo(AppLocalizations l10n) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: location.productImage != null
                ? CachedNetworkImage(
                    imageUrl: location.productImage!,
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                  )
                : Container(
                    width: 50,
                    height: 50,
                    color: Colors.grey[200],
                    child: const Icon(Icons.inventory_2, color: Colors.grey),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              location.productTitle!,
              style: const TextStyle(fontWeight: FontWeight.w500),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'picked_up':
        return Colors.blue;
      case 'in_transit':
        return Colors.orange;
      case 'delivered':
      case 'completed':
        return AppColors.success;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText(String status, AppLocalizations l10n) {
    switch (status) {
      case 'picked_up':
        return l10n.translate('picked_up');
      case 'in_transit':
        return l10n.translate('in_transit');
      case 'delivered':
        return l10n.translate('delivered');
      case 'completed':
        return l10n.translate('completed');
      default:
        return status;
    }
  }

  void _callTraveler() async {
    if (location.travelerPhone != null) {
      final uri = Uri.parse('tel:${location.travelerPhone}');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  void _messageTraveler() async {
    if (location.travelerPhone != null) {
      final uri = Uri.parse('sms:${location.travelerPhone}');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  void _navigateToDestination() async {
    final lat = location.destination.latitude;
    final lng = location.destination.longitude;
    final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
