import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../services/ui_config_service.dart';
import '../../../models/ui_config.dart';
import '../../../widgets/dynamic_home_screen.dart';
import '../widgets/home_app_bar.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/quick_features_widget.dart';

final homeConfigProvider = FutureProvider<UIConfigResponse>((ref) async {
  final service = UIConfigService();
  return service.getUIConfig();
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final configAsync = ref.watch(homeConfigProvider);
    final l10n = context.l10n;
    final isArabic = context.isArabic;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(homeConfigProvider);
          },
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverToBoxAdapter(
                child: HomeAppBar(
                  onNotificationTap: () => context.push('/notifications'),
                ),
              ),

              // Search Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: SearchBarWidget(
                    onTap: () => context.push('/search'),
                  ),
                ),
              ),

              // Quick Features (Voice, AR, Chatbot, Crypto, Wholesale, VR)
              const SliverToBoxAdapter(
                child: QuickFeaturesWidget(),
              ),

              // Dynamic Content
              configAsync.when(
                data: (config) => SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final section = config.sections[index];
                      return _buildSection(section, isArabic ? 'ar' : 'en');
                    },
                    childCount: config.sections.length,
                  ),
                ),
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (error, stack) => SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 64, color: AppColors.error),
                        const SizedBox(height: 16),
                        Text(l10n.translate('error')),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => ref.invalidate(homeConfigProvider),
                          child: Text(l10n.translate('retry')),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom Padding
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(UISection section, String lang) {
    return DynamicSectionWidget(
      section: section,
      language: lang,
      onItemTap: (item) => _handleItemTap(item),
      onViewAll: () => _handleViewAll(section),
    );
  }

  void _handleItemTap(UISectionItem item) {
    if (item.reference != null) {
      switch (item.reference!.type) {
        case 'product':
          context.push('/product/${item.reference!.id}');
          break;
        case 'category':
          context.push('/category/${item.reference!.id}');
          break;
        default:
          if (item.action?.url != null) {
            context.push(item.action!.url!);
          }
      }
    } else if (item.action?.url != null) {
      context.push(item.action!.url!);
    }
  }

  void _handleViewAll(UISection section) {
    // Navigate based on section type
    switch (section.componentSlug) {
      case 'featured_services':
      case 'new_services':
      case 'popular_services':
        context.push('/search?filter=${section.componentSlug}');
        break;
      case 'category_grid':
        context.push('/categories');
        break;
      default:
        break;
    }
  }
}

// Dynamic Section Widget
class DynamicSectionWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;
  final VoidCallback? onViewAll;

  const DynamicSectionWidget({
    super.key,
    required this.section,
    required this.language,
    required this.onItemTap,
    this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: section.backgroundColor != null
          ? _parseColor(section.backgroundColor!)
          : null,
      padding: EdgeInsets.only(
        top: section.padding?['top']?.toDouble() ?? 16,
        bottom: section.padding?['bottom']?.toDouble() ?? 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          if (section.getTitle(language) != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        section.getTitle(language)!,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (section.getSubtitle(language) != null)
                        Text(
                          section.getSubtitle(language)!,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                    ],
                  ),
                  if (section.config['show_view_all'] == true && onViewAll != null)
                    TextButton(
                      onPressed: onViewAll,
                      child: Text(
                        language == 'ar' ? 'عرض الكل' : 'View All',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 12),
          // Content - Use existing component widgets
          _buildContent(),
        ],
      ),
    );
  }

  Widget _buildContent() {
    // This would use the component widgets we created earlier
    // For now, a simple horizontal list
    return SizedBox(
      height: 200,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: section.items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final item = section.items[index];
          return GestureDetector(
            onTap: () => onItemTap(item),
            child: Container(
              width: 140,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                      ),
                      child: item.getImage(language) != null
                          ? ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                              child: Image.network(
                                item.getImage(language)!,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                errorBuilder: (_, __, ___) => const Icon(Icons.image, size: 40),
                              ),
                            )
                          : const Center(child: Icon(Icons.image, size: 40, color: Colors.grey)),
                    ),
                  ),
                  // Info
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.getTitle(language) ?? '',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (item.price != null)
                          Text(
                            '${item.price} ${item.currency ?? 'SAR'}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}
