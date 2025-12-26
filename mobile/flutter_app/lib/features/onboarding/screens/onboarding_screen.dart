import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/custom_button.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _currentPage = 0;

  final _pages = [
    {'icon': Icons.shopping_bag_outlined, 'title': 'تسوق بسهولة', 'titleEn': 'Shop Easily', 'desc': 'اكتشف آلاف المنتجات من أفضل البائعين', 'descEn': 'Discover thousands of products from top sellers'},
    {'icon': Icons.local_shipping_outlined, 'title': 'توصيل سريع', 'titleEn': 'Fast Delivery', 'desc': 'توصيل لباب منزلك في أسرع وقت', 'descEn': 'Delivery to your doorstep in no time'},
    {'icon': Icons.security_outlined, 'title': 'دفع آمن', 'titleEn': 'Secure Payment', 'desc': 'طرق دفع متعددة وآمنة 100%', 'descEn': 'Multiple secure payment methods'},
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final isArabic = l10n.locale.languageCode == 'ar';

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: AlignmentDirectional.topEnd,
              child: TextButton(
                onPressed: _completeOnboarding,
                child: Text(l10n.translate('skip')),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 150, height: 150,
                          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                          child: Icon(page['icon'] as IconData, size: 80, color: AppColors.primary),
                        ),
                        const SizedBox(height: 48),
                        Text(isArabic ? page['title'] as String : page['titleEn'] as String,
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        Text(isArabic ? page['desc'] as String : page['descEn'] as String,
                            style: TextStyle(fontSize: 16, color: AppColors.textSecondary), textAlign: TextAlign.center),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  SmoothPageIndicator(
                    controller: _pageController,
                    count: _pages.length,
                    effect: WormEffect(dotWidth: 10, dotHeight: 10, activeDotColor: AppColors.primary, dotColor: AppColors.border),
                  ),
                  const SizedBox(height: 32),
                  CustomButton(
                    text: _currentPage == _pages.length - 1 ? l10n.translate('get_started') : l10n.translate('next'),
                    onPressed: () {
                      if (_currentPage == _pages.length - 1) {
                        _completeOnboarding();
                      } else {
                        _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', true);
    if (mounted) context.go('/auth/login');
  }
}
