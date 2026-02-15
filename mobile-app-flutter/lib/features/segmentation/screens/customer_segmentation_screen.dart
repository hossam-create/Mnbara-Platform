import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CustomerSegmentationScreen extends ConsumerWidget {
  const CustomerSegmentationScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final segments = [
      {
        'id': 'vip',
        'name': 'VIP',
        'icon': '👑',
        'description': 'أعلى 5% من المشترين',
        'criteria': 'إنفاق أكثر من 50,000 ريال',
        'benefits': ['خصم 25%', 'مدير حساب مخصص', 'أولوية مطلقة'],
        'members': 750,
        'color': Colors.amber,
      },
      {
        'id': 'frequent',
        'name': 'المشترون المتكررون',
        'icon': '⭐',
        'description': 'المشترون المنتظمون',
        'criteria': 'أكثر من 10 عمليات شراء سنوياً',
        'benefits': ['خصم 15%', 'شحن مجاني', 'دعم أولوي'],
        'members': 5200,
        'color': Colors.blue,
      },
      {
        'id': 'occasional',
        'name': 'المشترون العرضيون',
        'icon': '🛍️',
        'description': 'المشترون غير المنتظمين',
        'criteria': '1-10 عمليات شراء سنوياً',
        'benefits': ['خصم 10%', 'عروض موسمية'],
        'members': 8900,
        'color': Colors.green,
      },
      {
        'id': 'inactive',
        'name': 'غير النشطين',
        'icon': '😴',
        'description': 'لم يشتروا في آخر 90 يوم',
        'criteria': 'عدم النشاط لمدة 90 يوم',
        'benefits': ['عروض استرجاع', 'خصم ترحيب'],
        'members': 3400,
        'color': Colors.grey,
      },
    ];

    final selectedSegment = segments[1]; // Default to frequent

    return Scaffold(
      appBar: AppBar(
        title: const Text('📊 تقسيم العملاء'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Current Segment
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    (selectedSegment['color'] as Color).withOpacity(0.7),
                    (selectedSegment['color'] as Color).withOpacity(0.4),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'فئتك الحالية',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${selectedSegment['icon']} ${selectedSegment['name']}',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'عدد الأعضاء',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${selectedSegment['members']}',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    selectedSegment['description'].toString(),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'المعايير: ${selectedSegment['criteria']}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                  ),
                ],
              ),
            ),
            // Segments List
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'جميع الفئات',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...segments.map((segment) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: (segment['color'] as Color).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: (segment['color'] as Color).withOpacity(0.3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${segment['icon']} ${segment['name']}',
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: (segment['color'] as Color).withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${segment['members']} عضو',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: segment['color'] as Color,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            segment['description'].toString(),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            children: (segment['benefits'] as List).map((benefit) {
                              return Chip(
                                label: Text(benefit.toString()),
                                backgroundColor: (segment['color'] as Color).withOpacity(0.2),
                                labelStyle: Theme.of(context).textTheme.bodySmall,
                              );
                            }).toList(),
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
}
