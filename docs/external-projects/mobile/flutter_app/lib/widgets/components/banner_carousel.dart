import 'package:flutter/material.dart';
import 'dart:async';
import '../../models/ui_config.dart';

class BannerCarouselWidget extends StatefulWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onTap;

  const BannerCarouselWidget({
    super.key,
    required this.section,
    required this.language,
    required this.onTap,
  });

  @override
  State<BannerCarouselWidget> createState() => _BannerCarouselWidgetState();
}

class _BannerCarouselWidgetState extends State<BannerCarouselWidget> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _autoScrollTimer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoScroll();
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    final config = widget.section.config;
    if (config['auto_scroll'] == true) {
      final interval = (config['scroll_interval'] ?? 4000) as int;
      _autoScrollTimer = Timer.periodic(Duration(milliseconds: interval), (_) {
        if (_pageController.hasClients && widget.section.items.isNotEmpty) {
          final nextPage = (_currentPage + 1) % widget.section.items.length;
          _pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.section.items;
    final config = widget.section.config;
    final height = (config['height'] ?? 180).toDouble();
    final showIndicators = config['show_indicators'] ?? true;

    if (items.isEmpty) {
      return SizedBox(
        height: height,
        child: const Center(child: Text('لا توجد بانرات')),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: height,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return GestureDetector(
                onTap: () => widget.onTap(item),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.grey[200],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (item.getImage(widget.language) != null)
                        Image.network(
                          item.getImage(widget.language)!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: Colors.grey[300],
                            child: const Icon(Icons.image, size: 50),
                          ),
                        ),
                      // Overlay text
                      if (item.getTitle(widget.language) != null)
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [Colors.black.withOpacity(0.7), Colors.transparent],
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.getTitle(widget.language)!,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (item.subtitleAr != null || item.subtitleEn != null)
                                  Text(
                                    widget.language == 'ar'
                                        ? (item.subtitleAr ?? item.subtitleEn ?? '')
                                        : (item.subtitleEn ?? item.subtitleAr ?? ''),
                                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                                  ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        // Indicators
        if (showIndicators && items.length > 1)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                items.length,
                (index) => Container(
                  width: _currentPage == index ? 20 : 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    color: _currentPage == index
                        ? Theme.of(context).primaryColor
                        : Colors.grey[300],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
