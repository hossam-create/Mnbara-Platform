import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../cart/providers/cart_provider.dart';
import '../../wishlist/providers/wishlist_provider.dart';
import '../providers/product_provider.dart';

class ProductDetailsScreen extends ConsumerStatefulWidget {
  final String productId;

  const ProductDetailsScreen({super.key, required this.productId});

  @override
  ConsumerState<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends ConsumerState<ProductDetailsScreen> {
  int _currentImageIndex = 0;
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailsProvider(widget.productId));
    final l10n = context.l10n;
    final isArabic = context.isArabic;
    final lang = isArabic ? 'ar' : 'en';

    return Scaffold(
      body: productAsync.when(
        data: (product) {
          final isInWishlist = ref.watch(wishlistProvider).contains(product.id);
          
          return CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                expandedHeight: 350,
                pinned: true,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
                    ),
                    child: const Icon(Icons.arrow_back_ios_new, size: 18),
                  ),
                  onPressed: () => context.pop(),
                ),
                actions: [
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
                      ),
                      child: Icon(
                        isInWishlist ? Icons.favorite : Icons.favorite_border,
                        size: 20,
                        color: isInWishlist ? AppColors.error : null,
                      ),
                    ),
                    onPressed: () {
                      ref.read(wishlistProvider.notifier).toggle(product.id);
                    },
                  ),
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 8)],
                      ),
                      child: const Icon(Icons.share, size: 20),
                    ),
                    onPressed: () {
                      // Share product
                    },
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    children: [
                      // Image Carousel
                      CarouselSlider.builder(
                        itemCount: product.images.isEmpty ? 1 : product.images.length,
                        itemBuilder: (context, index, _) {
                          if (product.images.isEmpty) {
                            return Container(
                              color: Colors.grey[100],
                              child: const Icon(Icons.image, size: 80, color: Colors.grey),
                            );
                          }
                          return Image.network(
                            product.images[index],
                            fit: BoxFit.cover,
                            width: double.infinity,
                            errorBuilder: (_, __, ___) => Container(
                              color: Colors.grey[100],
                              child: const Icon(Icons.image, size: 80, color: Colors.grey),
                            ),
                          );
                        },
                        options: CarouselOptions(
                          height: 350,
                          viewportFraction: 1,
                          onPageChanged: (index, _) {
                            setState(() => _currentImageIndex = index);
                          },
                        ),
                      ),
                      // Indicator
                      if (product.images.length > 1)
                        Positioned(
                          bottom: 16,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: AnimatedSmoothIndicator(
                              activeIndex: _currentImageIndex,
                              count: product.images.length,
                              effect: WormEffect(
                                dotWidth: 8,
                                dotHeight: 8,
                                activeDotColor: AppColors.primary,
                                dotColor: Colors.white.withOpacity(0.5),
                              ),
                            ),
                          ),
                        ),
                      // Discount Badge
                      if (product.hasDiscount)
                        Positioned(
                          top: 100,
                          right: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.error,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '-${product.discountPercentage.toStringAsFixed(0)}%',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              // Content
              SliverToBoxAdapter(
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title & Price
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                product.getTitle(lang),
                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${product.price} ${product.currency}',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                                if (product.hasDiscount)
                                  Text(
                                    '${product.originalPrice} ${product.currency}',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey,
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Rating
                        Row(
                          children: [
                            RatingBarIndicator(
                              rating: product.rating,
                              itemBuilder: (_, __) => const Icon(Icons.star, color: Colors.amber),
                              itemCount: 5,
                              itemSize: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${product.rating} (${product.reviewCount} ${l10n.translate('reviews')})',
                              style: TextStyle(color: Colors.grey[600], fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Stock Status
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: product.inStock ? AppColors.successLight : AppColors.errorLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            product.inStock
                                ? '${l10n.translate('in_stock')} (${product.stock})'
                                : l10n.translate('out_of_stock'),
                            style: TextStyle(
                              color: product.inStock ? AppColors.success : AppColors.error,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Description
                        Text(
                          l10n.translate('description'),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          product.getDescription(lang) ?? 'لا يوجد وصف',
                          style: TextStyle(color: Colors.grey[700], height: 1.6),
                        ),
                        const SizedBox(height: 24),

                        // Specifications
                        if (product.specifications != null && product.specifications!.isNotEmpty) ...[
                          Text(
                            l10n.translate('specifications'),
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),
                          ...product.specifications!.entries.map((e) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: Text(e.key, style: TextStyle(color: Colors.grey[600])),
                                ),
                                Expanded(
                                  flex: 3,
                                  child: Text(e.value.toString(), style: const TextStyle(fontWeight: FontWeight.w500)),
                                ),
                              ],
                            ),
                          )),
                          const SizedBox(height: 24),
                        ],

                        // Seller Info
                        if (product.sellerName != null) ...[
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.primary,
                                  child: Text(
                                    product.sellerName![0].toUpperCase(),
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        product.sellerName!,
                                        style: const TextStyle(fontWeight: FontWeight.w600),
                                      ),
                                      Text(
                                        'البائع',
                                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ),
                                TextButton(
                                  onPressed: () {},
                                  child: const Text('زيارة المتجر'),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppColors.error),
              const SizedBox(height: 16),
              Text(l10n.translate('error')),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(productDetailsProvider(widget.productId)),
                child: Text(l10n.translate('retry')),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: productAsync.whenOrNull(
        data: (product) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
          ),
          child: SafeArea(
            child: Row(
              children: [
                // Quantity
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove),
                        onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                      ),
                      Text('$_quantity', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: _quantity < product.stock ? () => setState(() => _quantity++) : null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                // Add to Cart
                Expanded(
                  child: CustomButton(
                    text: l10n.translate('add_to_cart'),
                    icon: Icons.shopping_cart_outlined,
                    onPressed: product.inStock
                        ? () {
                            ref.read(cartProvider.notifier).addItem(product, _quantity);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(l10n.translate('added_to_cart')),
                                action: SnackBarAction(
                                  label: l10n.translate('cart'),
                                  onPressed: () => context.push('/cart'),
                                ),
                              ),
                            );
                          }
                        : null,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
