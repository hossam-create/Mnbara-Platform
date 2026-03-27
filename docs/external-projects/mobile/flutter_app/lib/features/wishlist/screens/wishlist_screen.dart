import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/product_card.dart';
import '../../../shared/widgets/custom_button.dart';
import '../providers/wishlist_provider.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final wishlist = ref.watch(wishlistProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('wishlist')),
        actions: [
          if (wishlist.isNotEmpty)
            TextButton(
              onPressed: () => _showClearDialog(context, ref, l10n),
              child: Text(l10n.translate('clear_all')),
            ),
        ],
      ),
      body: wishlist.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.favorite_outline, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
                  const SizedBox(height: 24),
                  Text(l10n.translate('wishlist_empty'), style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(l10n.translate('wishlist_empty_desc'), style: TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: l10n.translate('start_shopping'),
                    onPressed: () => context.go('/'),
                    width: 200,
                  ),
                ],
              ),
            )
          : MasonryGridView.count(
              padding: const EdgeInsets.all(16),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              itemCount: wishlist.length,
              itemBuilder: (context, index) => ProductCard(product: wishlist[index], showWishlistButton: true),
            ),
    );
  }

  void _showClearDialog(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.translate('clear_wishlist')),
        content: Text(l10n.translate('clear_wishlist_confirm')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.translate('cancel'))),
          TextButton(
            onPressed: () {
              ref.read(wishlistProvider.notifier).clear();
              Navigator.pop(context);
            },
            child: Text(l10n.translate('clear'), style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}
