// Quick Features Widget - أزرار الوصول السريع للميزات المتقدمة
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class QuickFeaturesWidget extends StatelessWidget {
  const QuickFeaturesWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final features = [
      _Feature('🎤', 'بحث صوتي', '/voice-search', Colors.purple),
      _Feature('📱', 'AR معاينة', '/ar-preview', Colors.orange),
      _Feature('🤖', 'المساعد الذكي', '/chatbot', Colors.blue),
      _Feature('💰', 'محفظة كريبتو', '/crypto-wallet', Colors.amber),
      _Feature('🏪', 'سوق الجملة', '/wholesale', Colors.green),
      _Feature('🥽', 'صالة VR', '/vr-showroom', Colors.indigo),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'ميزات متقدمة',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: features.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final feature = features[index];
                return _buildFeatureItem(context, feature);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(BuildContext context, _Feature feature) {
    return GestureDetector(
      onTap: () => context.push(feature.route),
      child: Container(
        width: 80,
        decoration: BoxDecoration(
          color: feature.color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: feature.color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(feature.icon, style: const TextStyle(fontSize: 32)),
            const SizedBox(height: 8),
            Text(
              feature.label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: feature.color.withOpacity(0.8),
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}

class _Feature {
  final String icon;
  final String label;
  final String route;
  final Color color;

  _Feature(this.icon, this.label, this.route, this.color);
}
