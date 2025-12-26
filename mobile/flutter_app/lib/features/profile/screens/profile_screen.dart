import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';
import '../../settings/providers/settings_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('profile')),
        actions: [
          IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () => context.push('/settings')),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),
            _buildProfileHeader(context, user, l10n),
            const SizedBox(height: 24),
            _buildMenuSection(context, l10n, ref),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, user, AppLocalizations l10n) {
    return Column(
      children: [
        CircleAvatar(
          radius: 50,
          backgroundColor: AppColors.primary.withOpacity(0.1),
          backgroundImage: user?.avatar != null ? CachedNetworkImageProvider(user!.avatar!) : null,
          child: user?.avatar == null ? const Icon(Icons.person, size: 50, color: AppColors.primary) : null,
        ),
        const SizedBox(height: 16),
        Text(user?.name ?? l10n.translate('guest'), style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
        if (user?.email != null) ...[
          const SizedBox(height: 4),
          Text(user!.email, style: TextStyle(color: AppColors.textSecondary)),
        ],
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () => context.push('/edit-profile'),
          icon: const Icon(Icons.edit_outlined, size: 18),
          label: Text(l10n.translate('edit_profile')),
        ),
      ],
    );
  }

  Widget _buildMenuSection(BuildContext context, AppLocalizations l10n, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          _buildMenuItem(Icons.shopping_bag_outlined, l10n.translate('my_orders'), () => context.push('/orders')),
          _buildMenuItem(Icons.location_on_outlined, l10n.translate('addresses'), () => context.push('/addresses')),
          _buildMenuItem(Icons.favorite_outline, l10n.translate('wishlist'), () => context.go('/wishlist')),
          _buildMenuItem(Icons.notifications_outlined, l10n.translate('notifications'), () => context.push('/notifications')),
          _buildMenuItem(Icons.store_outlined, l10n.translate('seller_dashboard'), () => context.push('/seller/dashboard')),
          _buildMenuItem(Icons.flight_outlined, l10n.translate('traveler_dashboard'), () => context.push('/traveler/dashboard')),
          const Divider(height: 32),
          _buildMenuItem(Icons.help_outline, l10n.translate('help_center'), () {}),
          _buildMenuItem(Icons.info_outline, l10n.translate('about'), () {}),
          _buildMenuItem(Icons.privacy_tip_outlined, l10n.translate('privacy_policy'), () {}),
          const Divider(height: 32),
          _buildMenuItem(Icons.logout, l10n.translate('logout'), () => _showLogoutDialog(context, ref, l10n), isDestructive: true),
        ],
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, VoidCallback onTap, {bool isDestructive = false}) {
    return ListTile(
      leading: Icon(icon, color: isDestructive ? AppColors.error : AppColors.textSecondary),
      title: Text(title, style: TextStyle(color: isDestructive ? AppColors.error : null)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textSecondary),
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translate('logout')),
        content: Text(l10n.translate('logout_confirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.translate('cancel'))),
          TextButton(
            onPressed: () {
              ref.read(authProvider.notifier).logout();
              Navigator.pop(context);
              context.go('/auth/login');
            },
            child: Text(l10n.translate('logout'), style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
