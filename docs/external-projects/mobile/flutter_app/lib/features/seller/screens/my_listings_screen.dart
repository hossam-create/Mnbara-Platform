import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../products/models/product_model.dart';

class MyListingsScreen extends ConsumerStatefulWidget {
  const MyListingsScreen({super.key});

  @override
  ConsumerState<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends ConsumerState<MyListingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('my_listings')),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: l10n.translate('active')),
            Tab(text: l10n.translate('pending')),
            Tab(text: l10n.translate('sold')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildListingsTab(l10n, 'active'),
          _buildListingsTab(l10n, 'pending'),
          _buildListingsTab(l10n, 'sold'),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/seller/create-listing'),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildListingsTab(AppLocalizations l10n, String status) {
    // Mock data - replace with actual provider
    final listings = <Product>[];

    if (listings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
            const SizedBox(height: 24),
            Text(l10n.translate('no_listings'), style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(l10n.translate('no_listings_desc'), style: TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: listings.length,
      itemBuilder: (context, index) => _buildListingCard(listings[index], l10n),
    );
  }

  Widget _buildListingCard(Product product, AppLocalizations l10n) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: product.images.first,
                width: 80, height: 80, fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name, style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 2),
                  const SizedBox(height: 4),
                  Text('${product.price} ${l10n.translate('sar')}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.visibility_outlined, size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text('${product.views}', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      const SizedBox(width: 12),
                      Icon(Icons.favorite_outline, size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text('${product.likes}', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              onSelected: (value) {
                // Handle actions
              },
              itemBuilder: (context) => [
                PopupMenuItem(value: 'edit', child: Text(l10n.translate('edit'))),
                PopupMenuItem(value: 'promote', child: Text(l10n.translate('promote'))),
                PopupMenuItem(value: 'delete', child: Text(l10n.translate('delete'), style: const TextStyle(color: AppColors.error))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
