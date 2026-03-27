import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../providers/categories_provider.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.translate('categories'))),
      body: categoriesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(e.toString())),
        data: (categories) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final category = categories[index];
            return _buildCategoryCard(context, category, l10n);
          },
        ),
      ),
    );
  }

  Widget _buildCategoryCard(BuildContext context, Category category, AppLocalizations l10n) {
    final isArabic = l10n.locale.languageCode == 'ar';
    return InkWell(
      onTap: () => context.push('/category/${category.id}?name=${Uri.encodeComponent(isArabic ? category.nameAr : category.nameEn)}'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
              child: category.icon != null
                  ? CachedNetworkImage(imageUrl: category.icon!, width: 50, height: 50)
                  : Icon(Icons.category, size: 40, color: AppColors.primary),
            ),
            const SizedBox(height: 12),
            Text(
              isArabic ? category.nameAr : category.nameEn,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              textAlign: TextAlign.center,
            ),
            if (category.productCount > 0) ...[
              const SizedBox(height: 4),
              Text('${category.productCount} ${l10n.translate('products')}', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }
}
