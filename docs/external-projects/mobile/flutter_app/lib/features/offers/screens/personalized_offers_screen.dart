import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PersonalizedOffersScreen extends ConsumerWidget {
  const PersonalizedOffersScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers = [
      {
        'id': 1,
        'title': 'خصم 30% على الإلكترونيات',
        'description': 'بناءً على تاريخ شرائك',
        'discount': '30%',
        'category': 'إلكترونيات',
        'expiresIn': '3 أيام',
        'icon': '📱',
        'color': Colors.blue,
      },
      {
        'id': 2,
        'title': 'شحن مجاني على الملابس',
        'description': 'عرض خاص للعملاء المتكررين',
        'discount': 'مجاني',
        'category': 'ملابس',
        'expiresIn': '7 أيام',
        'icon': '👕',
        'color': Colors.pink,
      },
      {
        'id': 3,
        'title': 'اشتري 2 واحصل على 1 مجاني',
        'description': 'على المنتجات المختارة',
        'discount': '50%',
        'category': 'كتب',
        'expiresIn': '5 أيام',
        'icon': '📚',
        'color': Colors.orange,
      },
      {
        'id': 4,
        'title': 'خصم 25% على الأثاث',
        'description': 'عرض حصري للعملاء VIP',
        'discount': '25%',
        'category': 'أثاث',
        'expiresIn': '10 أيام',
        'icon': '🛋️',
        'color': Colors.brown,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('🎉 عروض مخصصة لك'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: offers.length,
                itemBuilder: (context, index) {
                  final offer = offers[index];
                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                (offer['color'] as Color).withOpacity(0.7),
                                (offer['color'] as Color).withOpacity(0.4),
                              ],
                            ),
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(12),
                              topRight: Radius.circular(12),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                offer['icon'].toString(),
                                style: const TextStyle(fontSize: 24),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                offer['title'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        // Content
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: (offer['color'] as Color).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    offer['discount'].toString(),
                                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                      color: offer['color'] as Color,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '⏰ ${offer['expiresIn']}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                                ),
                                const Spacer(),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: () {},
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: offer['color'] as Color,
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                    ),
                                    child: const Text(
                                      'تطبيق',
                                      style: TextStyle(color: Colors.white, fontSize: 12),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            // Offer History
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'سجل العروض',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...[
                    {'title': 'خصم 20% على الإلكترونيات', 'date': '2025-12-20', 'status': 'منتهي', 'savings': 150},
                    {'title': 'شحن مجاني', 'date': '2025-12-15', 'status': 'مستخدم', 'savings': 50},
                    {'title': 'نقاط مضاعفة', 'date': '2025-12-10', 'status': 'مستخدم', 'savings': 200},
                  ].map((item) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['title'].toString(),
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  item['date'].toString(),
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                item['status'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: item['status'] == 'منتهي' ? Colors.grey : Colors.green,
                                ),
                              ),
                              Text(
                                'توفير: ${item['savings']} ريال',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.green,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
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
