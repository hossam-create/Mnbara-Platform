import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final notifications = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('notifications')),
        actions: [
          if (notifications.isNotEmpty)
            TextButton(
              onPressed: () => ref.read(notificationsProvider.notifier).markAllAsRead(),
              child: Text(l10n.translate('mark_all_read')),
            ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
                  const SizedBox(height: 24),
                  Text(l10n.translate('no_notifications'), style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(l10n.translate('no_notifications_desc'), style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            )
          : ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return _buildNotificationItem(context, ref, notification, l10n);
              },
            ),
    );
  }

  Widget _buildNotificationItem(BuildContext context, WidgetRef ref, AppNotification notification, AppLocalizations l10n) {
    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppColors.error,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => ref.read(notificationsProvider.notifier).remove(notification.id),
      child: ListTile(
        leading: Container(
          width: 48, height: 48,
          decoration: BoxDecoration(
            color: _getNotificationColor(notification.type).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(_getNotificationIcon(notification.type), color: _getNotificationColor(notification.type)),
        ),
        title: Text(notification.title, style: TextStyle(fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notification.body, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(timeago.format(notification.createdAt), style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
        trailing: !notification.isRead ? Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)) : null,
        onTap: () => ref.read(notificationsProvider.notifier).markAsRead(notification.id),
      ),
    );
  }

  IconData _getNotificationIcon(NotificationType type) {
    switch (type) {
      case NotificationType.order: return Icons.shopping_bag_outlined;
      case NotificationType.promo: return Icons.local_offer_outlined;
      case NotificationType.system: return Icons.info_outline;
      case NotificationType.message: return Icons.message_outlined;
    }
  }

  Color _getNotificationColor(NotificationType type) {
    switch (type) {
      case NotificationType.order: return AppColors.primary;
      case NotificationType.promo: return AppColors.warning;
      case NotificationType.system: return AppColors.info;
      case NotificationType.message: return AppColors.success;
    }
  }
}
