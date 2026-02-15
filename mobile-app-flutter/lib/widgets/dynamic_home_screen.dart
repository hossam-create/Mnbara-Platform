import 'package:flutter/material.dart';
import '../models/ui_config.dart';
import '../services/ui_config_service.dart';
import 'components/horizontal_slider.dart';
import 'components/banner_carousel.dart';
import 'components/category_grid.dart';
import 'components/product_grid.dart';
import 'components/icon_bar.dart';
import 'components/countdown_timer.dart';
import 'components/testimonials.dart';

/// Dynamic Home Screen that renders UI based on server configuration
/// This allows the app UI to change without app store updates
class DynamicHomeScreen extends StatefulWidget {
  const DynamicHomeScreen({super.key});

  @override
  State<DynamicHomeScreen> createState() => _DynamicHomeScreenState();
}

class _DynamicHomeScreenState extends State<DynamicHomeScreen> {
  final UIConfigService _configService = UIConfigService();
  UIConfigResponse? _config;
  bool _isLoading = true;
  String? _error;
  String _currentLang = 'ar';

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final config = await _configService.getUIConfig(
        platform: Theme.of(context).platform == TargetPlatform.iOS ? 'ios' : 'android',
        language: _currentLang,
        forceRefresh: forceRefresh,
      );
      
      setState(() {
        _config = config;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => _loadConfig(forceRefresh: true),
                child: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => _loadConfig(forceRefresh: true),
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              floating: true,
              pinned: true,
              expandedHeight: 120,
              backgroundColor: _parseColor(_config!.theme.primaryColor),
              flexibleSpace: FlexibleSpaceBar(
                title: const Text('منبره'),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        _parseColor(_config!.theme.primaryColor),
                        _parseColor(_config!.theme.secondaryColor),
                      ],
                    ),
                  ),
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(50),
                child: Container(
                  margin: const EdgeInsets.all(8),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: _currentLang == 'ar' ? 'ابحث عن منتجات...' : 'Search products...',
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      prefixIcon: const Icon(Icons.search),
                    ),
                  ),
                ),
              ),
            ),

            // Dynamic Sections
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final section = _config!.sections[index];
                  return _buildSection(section);
                },
                childCount: _config!.sections.length,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build section widget based on component slug
  Widget _buildSection(UISection section) {
    // Track view
    _configService.trackEvent(
      type: 'view',
      entityType: 'section',
      entityId: section.id,
    );

    // Apply section styling
    final sectionWidget = _buildSectionContent(section);
    
    return Container(
      color: section.backgroundColor != null 
          ? _parseColor(section.backgroundColor!) 
          : null,
      padding: _parsePadding(section.padding),
      margin: _parsePadding(section.margin),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          if (section.getTitle(_currentLang) != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        section.getTitle(_currentLang)!,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: section.textColor != null 
                              ? _parseColor(section.textColor!) 
                              : null,
                        ),
                      ),
                      if (section.getSubtitle(_currentLang) != null)
                        Text(
                          section.getSubtitle(_currentLang)!,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                    ],
                  ),
                  if (section.config['show_view_all'] == true)
                    TextButton(
                      onPressed: () => _handleViewAll(section),
                      child: Text(_currentLang == 'ar' ? 'عرض الكل' : 'View All'),
                    ),
                ],
              ),
            ),
          
          // Section Content
          sectionWidget,
        ],
      ),
    );
  }

  /// Build section content based on component type
  Widget _buildSectionContent(UISection section) {
    switch (section.componentSlug) {
      case 'horizontal_slider':
      case 'featured_services':
      case 'new_services':
      case 'popular_services':
      case 'rewards_carousel':
      case 'exclusive_offers':
        return HorizontalSliderWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      case 'banner_carousel':
      case 'banner_single':
        return BannerCarouselWidget(
          section: section,
          language: _currentLang,
          onTap: _handleItemTap,
        );

      case 'category_grid':
      case 'icon_bar':
        return CategoryGridWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      case 'product_grid':
        return ProductGridWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      case 'countdown_timer':
        return CountdownTimerWidget(
          section: section,
          language: _currentLang,
        );

      case 'testimonials':
        return TestimonialsWidget(
          section: section,
          language: _currentLang,
        );

      case 'vertical_slider':
        return VerticalSliderWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      case 'multi_slider':
        return MultiSliderWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      case 'brands_slider':
        return BrandsSliderWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      case 'blog_articles':
        return BlogArticlesWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      case 'quick_actions':
        return QuickActionsWidget(
          section: section,
          language: _currentLang,
          onItemTap: _handleItemTap,
        );

      default:
        return Container(
          padding: const EdgeInsets.all(16),
          child: Text('Unknown component: ${section.componentSlug}'),
        );
    }
  }

  /// Handle item tap
  void _handleItemTap(UISectionItem item) {
    // Track click
    _configService.trackEvent(
      type: 'click',
      entityType: 'item',
      entityId: item.id,
    );

    // Handle action
    if (item.action != null) {
      _handleAction(item.action!);
    }
  }

  /// Handle view all tap
  void _handleViewAll(UISection section) {
    if (section.config['view_all_action'] != null) {
      _handleAction(ActionConfig.fromJson(section.config['view_all_action']));
    }
  }

  /// Handle action navigation
  void _handleAction(ActionConfig action) {
    switch (action.type) {
      case 'internal':
        // Navigate to internal screen
        if (action.screen != null) {
          Navigator.pushNamed(context, action.screen!, arguments: action.params);
        }
        break;
      
      case 'external':
        // Open external URL
        if (action.url != null) {
          // Use url_launcher package
          // launchUrl(Uri.parse(action.url!));
        }
        break;
      
      case 'deeplink':
        // Handle deep link
        if (action.url != null) {
          // Handle deep link navigation
        }
        break;
    }
  }

  /// Parse color from hex string
  Color _parseColor(String hex) {
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) {
      hex = 'FF$hex';
    }
    return Color(int.parse(hex, radix: 16));
  }

  /// Parse padding from config
  EdgeInsets? _parsePadding(Map<String, dynamic>? padding) {
    if (padding == null) return null;
    return EdgeInsets.only(
      top: (padding['top'] ?? 0).toDouble(),
      bottom: (padding['bottom'] ?? 0).toDouble(),
      left: (padding['left'] ?? 0).toDouble(),
      right: (padding['right'] ?? 0).toDouble(),
    );
  }
}

// Placeholder widgets - implement these based on your design
class VerticalSliderWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;
  
  const VerticalSliderWidget({super.key, required this.section, required this.language, required this.onItemTap});
  
  @override
  Widget build(BuildContext context) => const SizedBox();
}

class MultiSliderWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;
  
  const MultiSliderWidget({super.key, required this.section, required this.language, required this.onItemTap});
  
  @override
  Widget build(BuildContext context) => const SizedBox();
}

class BrandsSliderWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;
  
  const BrandsSliderWidget({super.key, required this.section, required this.language, required this.onItemTap});
  
  @override
  Widget build(BuildContext context) => const SizedBox();
}

class BlogArticlesWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;
  
  const BlogArticlesWidget({super.key, required this.section, required this.language, required this.onItemTap});
  
  @override
  Widget build(BuildContext context) => const SizedBox();
}

class QuickActionsWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;
  
  const QuickActionsWidget({super.key, required this.section, required this.language, required this.onItemTap});
  
  @override
  Widget build(BuildContext context) => const SizedBox();
}
