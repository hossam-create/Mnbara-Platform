import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/product_card.dart';
import '../../products/models/product_model.dart';
import '../../products/providers/product_provider.dart';

class CategoryProductsScreen extends ConsumerStatefulWidget {
  final String categoryId;
  final String categoryName;

  const CategoryProductsScreen({super.key, required this.categoryId, required this.categoryName});

  @override
  ConsumerState<CategoryProductsScreen> createState() => _CategoryProductsScreenState();
}

class _CategoryProductsScreenState extends ConsumerState<CategoryProductsScreen> {
  String _sortBy = 'newest';
  RangeValues _priceRange = const RangeValues(0, 10000);

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final productsAsync = ref.watch(categoryProductsProvider(widget.categoryId));

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.categoryName),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () => _showFilterSheet(context, l10n)),
        ],
      ),
      body: Column(
        children: [
          _buildSortBar(l10n),
          Expanded(
            child: productsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text(e.toString())),
              data: (products) {
                if (products.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
                        const SizedBox(height: 24),
                        Text(l10n.translate('no_products'), style: Theme.of(context).textTheme.titleLarge),
                      ],
                    ),
                  );
                }
                return MasonryGridView.count(
                  padding: const EdgeInsets.all(16),
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  itemCount: products.length,
                  itemBuilder: (context, index) => ProductCard(product: products[index]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSortBar(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)]),
      child: Row(
        children: [
          Text(l10n.translate('sort_by'), style: TextStyle(color: AppColors.textSecondary)),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: _sortBy,
            underline: const SizedBox(),
            items: [
              DropdownMenuItem(value: 'newest', child: Text(l10n.translate('newest'))),
              DropdownMenuItem(value: 'price_low', child: Text(l10n.translate('price_low_high'))),
              DropdownMenuItem(value: 'price_high', child: Text(l10n.translate('price_high_low'))),
              DropdownMenuItem(value: 'popular', child: Text(l10n.translate('most_popular'))),
            ],
            onChanged: (value) => setState(() => _sortBy = value!),
          ),
        ],
      ),
    );
  }

  void _showFilterSheet(BuildContext context, AppLocalizations l10n) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l10n.translate('filters'), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  TextButton(onPressed: () => setSheetState(() => _priceRange = const RangeValues(0, 10000)), child: Text(l10n.translate('reset'))),
                ],
              ),
              const SizedBox(height: 24),
              Text(l10n.translate('price_range'), style: const TextStyle(fontWeight: FontWeight.w600)),
              RangeSlider(
                values: _priceRange,
                min: 0, max: 10000,
                divisions: 100,
                labels: RangeLabels('${_priceRange.start.round()} ${l10n.translate('sar')}', '${_priceRange.end.round()} ${l10n.translate('sar')}'),
                onChanged: (values) => setSheetState(() => _priceRange = values),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {});
                    Navigator.pop(context);
                  },
                  child: Text(l10n.translate('apply_filters')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
