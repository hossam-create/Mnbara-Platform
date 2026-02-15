import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FraudDetectionScreen extends ConsumerWidget {
  const FraudDetectionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final securityStatus = {
      'overallScore': 92,
      'status': 'آمن جداً',
      'lastChecked': '2025-12-23 10:30',
      'alerts': 0,
    };

    final recentActivity = [
      {'type': 'login', 'device': 'Chrome - Windows', 'location': 'الرياض', 'time': '2025-12-23 10:15', 'status': 'verified'},
      {'type': 'purchase', 'device': 'Safari - iPhone', 'location': 'الرياض', 'time': '2025-12-22 14:30', 'status': 'verified'},
      {'type': 'login', 'device': 'Chrome - Windows', 'location': 'الرياض', 'time': '2025-12-22 09:00', 'status': 'verified'},
    ];

    final securitySettings = [
      {'title': 'المصادقة الثنائية', 'status': 'مفعل', 'icon': '🔐'},
      {'title': 'كلمة المرور القوية', 'status': 'مفعل', 'icon': '🔑'},
      {'title': 'التحقق من البريد', 'status': 'مفعل', 'icon': '📧'},
      {'title': 'التحقق من الهاتف', 'status': 'مفعل', 'icon': '📱'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('🛡️ الأمان والحماية'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Security Score
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.green.shade400, Colors.emerald.shade400],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'درجة الأمان',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            securityStatus['status'].toString(),
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
                          ),
                        ],
                      ),
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${securityStatus['overallScore']}',
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'آخر فحص',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                securityStatus['lastChecked'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'التنبيهات',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${securityStatus['alerts']} تنبيهات',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Security Settings
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '⚙️ إعدادات الأمان',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...securitySettings.map((setting) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(
                                setting['icon'].toString(),
                                style: const TextStyle(fontSize: 20),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                setting['title'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.green.shade200,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '✓ ${setting['status']}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.green.shade700,
                                fontSize: 10,
                              ),
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
            // Recent Activity
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '📊 النشاط الأخير',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...recentActivity.map((activity) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Text(
                            activity['type'] == 'login' ? '🔓' : '🛍️',
                            style: const TextStyle(fontSize: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  activity['type'] == 'login' ? 'دخول' : 'عملية شراء',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  '${activity['device']} • ${activity['location']}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                activity['time'].toString(),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey, fontSize: 10),
                              ),
                              Text(
                                '✓ تم التحقق',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.green, fontSize: 10),
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
