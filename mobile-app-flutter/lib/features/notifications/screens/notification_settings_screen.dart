import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🔔 إعدادات الإشعارات'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Email Preferences
            _buildSection(
              context,
              '📧 إشعارات البريد الإلكتروني',
              [
                _buildToggleItem(context, 'عروض وخصومات', 'احصل على أحدث العروض الخاصة', true),
                _buildToggleItem(context, 'تحديثات الطلبات', 'تتبع حالة طلباتك', true),
                _buildToggleItem(context, 'النشرة الإخبارية', 'أخبار وتحديثات منبرة', false),
              ],
            ),
            // SMS Preferences
            _buildSection(
              context,
              '📱 إشعارات الرسائل النصية',
              [
                _buildToggleItem(context, 'عروض وخصومات', 'احصل على عروض سريعة عبر SMS', true),
                _buildToggleItem(context, 'تحديثات الطلبات', 'تنبيهات فورية عن طلباتك', true),
              ],
            ),
            // Push Notifications
            _buildSection(
              context,
              '🔔 إشعارات التطبيق',
              [
                _buildToggleItem(context, 'تفعيل الإشعارات', 'احصل على تنبيهات فورية', true),
              ],
            ),
            // Frequency
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '⏰ تكرار الإشعارات',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildFrequencyButton(context, 'كل ساعة', false),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildFrequencyButton(context, 'يومياً', true),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _buildFrequencyButton(context, 'أسبوعياً', false),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Notification History
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '📋 سجل الإشعارات',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...[
                    {'type': 'email', 'title': 'عرض خاص: خصم 30%', 'date': '2025-12-23'},
                    {'type': 'sms', 'title': 'طلبك قيد التسليم', 'date': '2025-12-22'},
                    {'type': 'push', 'title': 'نقاطك: 2500 نقطة', 'date': '2025-12-21'},
                  ].map((item) {
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
                            item['type'] == 'email' ? '📧' : item['type'] == 'sms' ? '📱' : '🔔',
                            style: const TextStyle(fontSize: 20),
                          ),
                          const SizedBox(width: 12),
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
                          Text(
                            '✓',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.green),
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

  Widget _buildSection(BuildContext context, String title, List<Widget> items) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          ...items,
        ],
      ),
    );
  }

  Widget _buildToggleItem(BuildContext context, String title, String subtitle, bool value) {
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
                  title,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: (val) {},
          ),
        ],
      ),
    );
  }

  Widget _buildFrequencyButton(BuildContext context, String label, bool isSelected) {
    return ElevatedButton(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: isSelected ? Colors.purple : Colors.grey.shade200,
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : Colors.black,
          fontSize: 12,
        ),
      ),
    );
  }
}
