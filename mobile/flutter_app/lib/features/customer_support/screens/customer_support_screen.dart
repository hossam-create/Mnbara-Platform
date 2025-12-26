import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CustomerSupportScreen extends ConsumerWidget {
  const CustomerSupportScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final faqs = [
      {
        'question': 'كيف أتتبع طلبي؟',
        'answer': 'يمكنك تتبع طلبك من خلال قسم الطلبات. ستجد رقم التتبع والحالة الحالية.',
      },
      {
        'question': 'ما هي سياسة الإرجاع؟',
        'answer': 'يمكنك إرجاع المنتجات خلال 30 يوماً من الشراء في حالة جديدة.',
      },
      {
        'question': 'كيف أغير كلمة المرور؟',
        'answer': 'اذهب إلى الإعدادات > الأمان > تغيير كلمة المرور.',
      },
      {
        'question': 'هل يمكنني إلغاء طلبي؟',
        'answer': 'نعم، يمكنك إلغاء الطلب قبل شحنه من تفاصيل الطلب.',
      },
    ];

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('💬 دعم العملاء'),
          centerTitle: true,
          elevation: 0,
          bottom: const TabBar(
            tabs: [
              Tab(text: '💬 الدردشة'),
              Tab(text: '❓ الأسئلة'),
              Tab(text: '📧 اتصل'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Live Chat
            _buildChatTab(context),
            // FAQ
            _buildFAQTab(context, faqs),
            // Contact
            _buildContactTab(context),
          ],
        ),
      ),
    );
  }

  Widget _buildChatTab(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'مرحباً! كيف يمكننا مساعدتك؟',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'أحتاج إلى مساعدة في طلبي',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'اكتب رسالتك...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                child: const Text('إرسال'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFAQTab(BuildContext context, List<Map<String, String>> faqs) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: faqs.length,
      itemBuilder: (context, index) {
        final faq = faqs[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
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
          child: ExpansionTile(
            title: Text(
              faq['question']!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  faq['answer']!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContactTab(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            decoration: InputDecoration(
              labelText: 'الاسم',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            decoration: InputDecoration(
              labelText: 'البريد الإلكتروني',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            decoration: InputDecoration(
              labelText: 'الموضوع',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            items: const [
              DropdownMenuItem(value: 'complaint', child: Text('شكوى')),
              DropdownMenuItem(value: 'inquiry', child: Text('استفسار')),
              DropdownMenuItem(value: 'suggestion', child: Text('اقتراح')),
            ],
            onChanged: (value) {},
          ),
          const SizedBox(height: 12),
          TextField(
            maxLines: 5,
            decoration: InputDecoration(
              labelText: 'الرسالة',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text('إرسال الرسالة'),
            ),
          ),
          const SizedBox(height: 24),
          // Contact Info
          Text(
            'معلومات التواصل',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          _buildContactInfo(context, '📞', 'الهاتف', '+966 11 1234 5678'),
          const SizedBox(height: 12),
          _buildContactInfo(context, '📧', 'البريد الإلكتروني', 'support@mnbara.com'),
          const SizedBox(height: 12),
          _buildContactInfo(context, '🕐', 'ساعات العمل', '24/7'),
        ],
      ),
    );
  }

  Widget _buildContactInfo(BuildContext context, String icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
