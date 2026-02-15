import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../core/theme/app_colors.dart';
import '../../core/l10n/app_localizations.dart';
import '../../features/products/models/product_model.dart';
import '../../features/wishlist/providers/wishlist_provider.dart';
import '../../features/cart/providers/cart_provider.dart';

class ProductCard extends ConsumerWidget {
  final Product product;
  final bool showWishlistButton;

  const ProductCard({super.key, required this.product, this.showWishlistButton = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final isInWishlist = ref.watch(wishlistProvider.select((list) => list.any((p) => p.id == product.id)));

    return InkWell(
      onTap: () => context.push('/product/${product.id}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: CachedNetworkImage(
                    imageUrl: product.images.first,
                    height: 150, width: double.infinity, fit: BoxFit.cover,
                    placeholder: (_, __) => Container(height: 150, color: AppColors.surface),
                    errorWidget: (_, __, ___) => Container(height: 150, color: AppColors.surface, child: const Icon(Icons.image)),
                  ),
                ),
                if (product.discount > 0)
                  Positioned(
                    top: 8, left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(4)),
                      child: Text('-${product.discount}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                if (showWishlistButton)
                  Positioned(
                    top: 8, right: 8,
                    child: GestureDetector(
                      onTap: () => ref.read(wishlistProvider.notifier).toggle(product),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)]),
                        child: Icon(isInWishlist ? Icons.favorite : Icons.favorite_outline, size: 18, color: isInWishlist ? AppColors.error : AppColors.textSecondary),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name, style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text('${product.price} ${l10n.translate('sar')}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
                      if (product.originalPrice != null) ...[
                        const SizedBox(width: 8),
                        Text('${product.originalPrice} ${l10n.translate('sar')}', style: const TextStyle(color: AppColors.textSecondary, decoration: TextDecoration.lineThrough, fontSize: 12)),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 14, color: Colors.amber),
                      const SizedBox(width: 4),
                      Text('${product.rating}', style: const TextStyle(fontSize: 12)),
                      const SizedBox(width: 4),
                      Text('(${product.reviewCount})', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
