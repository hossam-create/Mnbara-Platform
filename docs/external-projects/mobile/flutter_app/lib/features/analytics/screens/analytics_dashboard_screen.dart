import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AnalyticsDashboardScreen extends ConsumerWidget {
  const AnalyticsDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = {
      'totalPurchases': 45,
      'totalSpent': 12500,
      'averageOrderValue': 278,
      'lastPurchase': '2025-12-23',
      'engagementScore': 92,
      'favoriteCategory': 'إلكترونيات',
    };

    final monthlyData = [
      {'month': 'يناير', 'purchases': 3, 'spent': 800},
      {'month': 'فبراير', 'purchases': 4, 'spent': 950},
      {'month': 'مارس', 'purchases': 2, 'spent': 600},
      {'month': 'أبريل', 'purchases': 5, 'spent': 1200},
      {'month': 'مايو', 'purchases': 3, 'spent': 750},
      {'month': 'يونيو', 'purchases': 4, 'spent': 1100},
    ];

    final categoryBreakdown = [
      {'category': 'إلكترونيات', 'percentage': 35, 'amount': 4375},
      {'category': 'ملابس', 'percentage': 25, 'amount': 3125},
      {'category': 'كتب', 'percentage': 20, 'amount': 2500},
      {'category': 'أثاث', 'percentage': 15, 'amount': 1875},
      {'category': 'أخرى', 'percentage': 5, 'amount': 625},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('📊 لوحة التحليلات'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Key Metrics
            Padding(
              padding: const EdgeInsets.all(16),
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                children: [
                  _buildMetricCard(
                    context,
                    'إجمالي المشتريات',
                    '${stats['totalPurchases']}',
                    Colors.blue,
                    '🛍️',
                  ),
                  _buildMetricCard(
                    context,
                    'إجمالي الإنفاق',
                    '${stats['totalSpent']} ريال',
                    Colors.green,
                    '💰',
                  ),
                  _buildMetricCard(
                    context,
                    'متوسط الطلب',
                    '${stats['averageOrderValue']} ريال',
                    Colors.purple,
                    '📈',
                  ),
                  _buildMetricCard(
                    context,
                    'درجة الانخراط',
                    '${stats['engagementScore']}%',
                    Colors.orange,
                    '⭐',
                  ),
                ],
              ),
            ),
            // Monthly Trend
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'الاتجاه الشهري',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...monthlyData.map((data) {
                    final maxSpent = monthlyData.map((d) => d['spent'] as int).reduce((a, b) => a > b ? a : b);
                    final percentage = ((data['spent'] as int) / maxSpent) * 100;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                data['month'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${data['purchases']} عملية - ${data['spent']} ريال',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: percentage / 100,
                              minHeight: 6,
                              backgroundColor: Colors.grey.shade200,
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.teal),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Category Breakdown
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'توزيع الفئات',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...categoryBreakdown.map((item) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                item['category'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                '${item['percentage']}% (${item['amount']} ريال)',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: (item['percentage'] as int) / 100,
                              minHeight: 8,
                              backgroundColor: Colors.grey.shade200,
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.cyan),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(BuildContext context, String label, String value, Color color, String icon) {
    return Container(
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(icon, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(color: color),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
