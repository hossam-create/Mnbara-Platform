import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../cart/providers/cart_provider.dart';
import '../../profile/providers/address_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  int _selectedAddressIndex = 0;
  String _selectedPaymentMethod = 'card';

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final cart = ref.watch(cartProvider);
    final addresses = ref.watch(addressProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('checkout'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionTitle(l10n.translate('delivery_address')),
            const SizedBox(height: 12),
            if (addresses.isEmpty)
              _buildAddAddressCard(context, l10n)
            else
              ...addresses.asMap().entries.map((e) => _buildAddressCard(e.key, e.value, l10n)),
            TextButton.icon(
              onPressed: () => context.push('/add-address'),
              icon: const Icon(Icons.add),
              label: Text(l10n.translate('add_new_address')),
            ),
            const SizedBox(height: 24),
            _buildSectionTitle(l10n.translate('payment_method')),
            const SizedBox(height: 12),
            _buildPaymentOption('card', Icons.credit_card, l10n.translate('credit_card'), l10n),
            _buildPaymentOption('apple_pay', Icons.apple, 'Apple Pay', l10n),
            _buildPaymentOption('cod', Icons.money, l10n.translate('cash_on_delivery'), l10n),
            const SizedBox(height: 24),
            _buildSectionTitle(l10n.translate('order_summary')),
            const SizedBox(height: 12),
            _buildOrderSummary(cart, l10n),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(context, cart, l10n),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold));
  }

  Widget _buildAddAddressCard(BuildContext context, AppLocalizations l10n) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.add_location_alt_outlined, color: AppColors.primary),
        title: Text(l10n.translate('add_delivery_address')),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/add-address'),
      ),
    );
  }

  Widget _buildAddressCard(int index, Address address, AppLocalizations l10n) {
    final isSelected = _selectedAddressIndex == index;
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: isSelected ? AppColors.primary : Colors.transparent, width: 2),
      ),
      child: InkWell(
        onTap: () => setState(() => _selectedAddressIndex = index),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_off, color: isSelected ? AppColors.primary : AppColors.textSecondary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(address.label, style: const TextStyle(fontWeight: FontWeight.bold)),
                        if (address.isDefault) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                            child: Text(l10n.translate('default'), style: const TextStyle(fontSize: 10, color: AppColors.primary)),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(address.fullAddress, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                    Text(address.phone, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentOption(String value, IconData icon, String label, AppLocalizations l10n) {
    final isSelected = _selectedPaymentMethod == value;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: isSelected ? AppColors.primary : Colors.transparent, width: 2),
      ),
      child: ListTile(
        leading: Icon(icon, color: isSelected ? AppColors.primary : AppColors.textSecondary),
        title: Text(label),
        trailing: Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_off, color: isSelected ? AppColors.primary : AppColors.textSecondary),
        onTap: () => setState(() => _selectedPaymentMethod = value),
      ),
    );
  }

  Widget _buildOrderSummary(CartState cart, AppLocalizations l10n) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildSummaryRow(l10n.translate('items'), '${cart.itemCount}'),
            _buildSummaryRow(l10n.translate('subtotal'), '${cart.subtotal.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            _buildSummaryRow(l10n.translate('shipping'), cart.shipping == 0 ? l10n.translate('free') : '${cart.shipping.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            _buildSummaryRow(l10n.translate('vat'), '${cart.tax.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            if (cart.discount > 0) _buildSummaryRow(l10n.translate('discount'), '-${cart.discount.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            const Divider(height: 24),
            _buildSummaryRow(l10n.translate('total'), '${cart.total.toStringAsFixed(2)} ${l10n.translate('sar')}', isTotal: true),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: isTotal ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontWeight: isTotal ? FontWeight.bold : FontWeight.normal, color: isTotal ? AppColors.primary : null)),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, CartState cart, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))]),
      child: SafeArea(
        child: CustomButton(
          text: '${l10n.translate('pay')} ${cart.total.toStringAsFixed(2)} ${l10n.translate('sar')}',
          onPressed: () => context.push('/payment'),
        ),
      ),
    );
  }
}
