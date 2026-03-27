import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_button.dart';
import '../providers/cart_provider.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final cart = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('cart')),
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed: () => _showClearCartDialog(context, ref),
              child: Text(l10n.translate('clear_all')),
            ),
        ],
      ),
      body: cart.items.isEmpty
          ? _buildEmptyCart(context, l10n)
          : _buildCartContent(context, ref, cart, l10n),
    );
  }

  Widget _buildEmptyCart(BuildContext context, AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
          const SizedBox(height: 24),
          Text(l10n.translate('cart_empty'), style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(l10n.translate('cart_empty_desc'), style: TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 24),
          CustomButton(
            text: l10n.translate('start_shopping'),
            onPressed: () => context.go('/'),
            width: 200,
          ),
        ],
      ),
    );
  }

  Widget _buildCartContent(BuildContext context, WidgetRef ref, CartState cart, AppLocalizations l10n) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: cart.items.length,
            itemBuilder: (context, index) => _buildCartItem(context, ref, cart.items[index], l10n),
          ),
        ),
        _buildCartSummary(context, cart, l10n),
      ],
    );
  }

  Widget _buildCartItem(BuildContext context, WidgetRef ref, CartItem item, AppLocalizations l10n) {
    return Dismissible(
      key: Key(item.product.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: AppColors.error,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => ref.read(cartProvider.notifier).removeItem(item.product.id),
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: item.product.images.first,
                  width: 80, height: 80, fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.surface),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 2),
                    const SizedBox(height: 4),
                    Text('${item.product.price} ${l10n.translate('sar')}',
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              Column(
                children: [
                  Row(
                    children: [
                      _buildQuantityButton(Icons.remove, () => ref.read(cartProvider.notifier).decrementQuantity(item.product.id)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                      _buildQuantityButton(Icons.add, () => ref.read(cartProvider.notifier).incrementQuantity(item.product.id)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('${item.total.toStringAsFixed(2)} ${l10n.translate('sar')}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuantityButton(IconData icon, VoidCallback onPressed) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(border: Border.all(color: AppColors.border), borderRadius: BorderRadius.circular(4)),
        child: Icon(icon, size: 16),
      ),
    );
  }

  Widget _buildCartSummary(BuildContext context, CartState cart, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: Column(
          children: [
            _buildSummaryRow(l10n.translate('subtotal'), '${cart.subtotal.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            _buildSummaryRow(l10n.translate('shipping'), cart.shipping == 0 ? l10n.translate('free') : '${cart.shipping.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            _buildSummaryRow(l10n.translate('vat'), '${cart.tax.toStringAsFixed(2)} ${l10n.translate('sar')}'),
            if (cart.discount > 0) _buildSummaryRow(l10n.translate('discount'), '-${cart.discount.toStringAsFixed(2)} ${l10n.translate('sar')}', isDiscount: true),
            const Divider(height: 24),
            _buildSummaryRow(l10n.translate('total'), '${cart.total.toStringAsFixed(2)} ${l10n.translate('sar')}', isTotal: true),
            const SizedBox(height: 16),
            CustomButton(text: l10n.translate('checkout'), onPressed: () => context.push('/checkout')),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false, bool isDiscount = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: isTotal ? 16 : 14, fontWeight: isTotal ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: isTotal ? 18 : 14, fontWeight: isTotal ? FontWeight.bold : FontWeight.normal, color: isDiscount ? AppColors.success : (isTotal ? AppColors.primary : null))),
        ],
      ),
    );
  }

  void _showClearCartDialog(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translate('clear_cart')),
        content: Text(l10n.translate('clear_cart_confirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.translate('cancel'))),
          TextButton(
            onPressed: () {
              ref.read(cartProvider.notifier).clearCart();
              Navigator.pop(context);
            },
            child: Text(l10n.translate('clear'), style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
