import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SpecialDateRewardsScreen extends ConsumerWidget {
  const SpecialDateRewardsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final specialDates = [
      {
        'id': 'birthday',
        'type': 'عيد ميلاد',
        'date': '2025-01-15',
        'daysUntil': 23,
        'reward': 500,
        'icon': '🎂',
        'color': Colors.pink,
      },
      {
        'id': 'anniversary',
        'type': 'ذكرى الانضمام',
        'date': '2025-12-25',
        'daysUntil': 0,
        'reward': 300,
        'icon': '🎉',
        'color': Colors.purple,
      },
      {
        'id': 'registration',
        'type': 'ذكرى التسجيل',
        'date': '2024-12-25',
        'daysUntil': -1,
        'reward': 200,
        'icon': '🎊',
        'color': Colors.orange,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('🎁 مكافآت التواريخ الخاصة'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Upcoming Rewards
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '🗓️ التواريخ القادمة',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...specialDates.map((item) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            (item['color'] as Color).withOpacity(0.7),
                            (item['color'] as Color).withOpacity(0.4),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      item['icon'].toString(),
                                      style: const TextStyle(fontSize: 32),
                                    ),
                                    if (item['daysUntil'] == 0)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.yellow.shade400,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          'اليوم',
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: Colors.black,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      )
                                    else if (item['daysUntil'] > 0)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          'بعد ${item['daysUntil']} يوم',
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  item['type'].toString(),
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(color: Colors.white),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'احصل على ${item['reward']} نقطة',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '📅 ${item['date']}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: item['daysUntil'] < 0 ? null : () {},
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white,
                                      disabledBackgroundColor: Colors.grey.shade300,
                                    ),
                                    child: Text(
                                      item['daysUntil'] < 0 ? 'انتهى' : 'استلام المكافأة',
                                      style: TextStyle(
                                        color: item['daysUntil'] < 0 ? Colors.grey : item['color'],
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
            // How It Works
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'كيف يعمل البرنامج',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildHowItWorksStep(context, '📅', 'التواريخ المهمة', 'نتذكر تواريخك'),
                      _buildHowItWorksStep(context, '🎁', 'مكافآت خاصة', 'نقاط إضافية'),
                      _buildHowItWorksStep(context, '✨', 'استمتع', 'استخدم النقاط'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Reward History
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '📋 سجل المكافآت',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...[
                    {'date': '2025-12-25', 'type': 'ذكرى الانضمام', 'reward': 300, 'status': 'claimed'},
                    {'date': '2025-06-15', 'type': 'عيد ميلاد', 'reward': 500, 'status': 'claimed'},
                    {'date': '2024-12-25', 'type': 'ذكرى التسجيل', 'reward': 200, 'status': 'claimed'},
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
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['type'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                item['date'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '+${item['reward']}',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.pink,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '✓ تم الاستلام',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.green),
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

  Widget _buildHowItWorksStep(BuildContext context, String icon, String title, String desc) {
    return Column(
      children: [
        Text(icon, style: const TextStyle(fontSize: 28)),
        const SizedBox(height: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          desc,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
