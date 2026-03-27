import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/address_provider.dart';

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final addresses = ref.watch(addressProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('addresses'))),
      body: addresses.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_off_outlined, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
                  const SizedBox(height: 24),
                  Text(l10n.translate('no_addresses'), style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(l10n.translate('no_addresses_desc'), style: TextStyle(color: AppColors.textSecondary)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: addresses.length,
              itemBuilder: (context, index) => _buildAddressCard(context, ref, addresses[index], l10n),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/add-address'),
        icon: const Icon(Icons.add),
        label: Text(l10n.translate('add_address')),
      ),
    );
  }

  Widget _buildAddressCard(BuildContext context, WidgetRef ref, Address address, AppLocalizations l10n) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(address.label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                if (address.isDefault) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                    child: Text(l10n.translate('default'), style: const TextStyle(fontSize: 10, color: AppColors.primary)),
                  ),
                ],
                const Spacer(),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') {
                      // Navigate to edit
                    } else if (value == 'delete') {
                      ref.read(addressProvider.notifier).removeAddress(address.id);
                    } else if (value == 'default') {
                      ref.read(addressProvider.notifier).setDefault(address.id);
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(value: 'edit', child: Text(l10n.translate('edit'))),
                    if (!address.isDefault) PopupMenuItem(value: 'default', child: Text(l10n.translate('set_default'))),
                    PopupMenuItem(value: 'delete', child: Text(l10n.translate('delete'), style: const TextStyle(color: AppColors.error))),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(address.fullAddress, style: TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 4),
            Text(address.phone, style: TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
