import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SupportTicketsScreen extends ConsumerWidget {
  const SupportTicketsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tickets = [
      {
        'id': 'TKT-2025-001',
        'title': 'المنتج لم يصل بعد',
        'category': 'الشحن',
        'priority': 'high',
        'status': 'in_progress',
        'createdAt': '2025-12-20',
        'description': 'طلبت منتج ولم يصل حتى الآن',
      },
      {
        'id': 'TKT-2025-002',
        'title': 'المنتج معيب',
        'category': 'جودة المنتج',
        'priority': 'high',
        'status': 'resolved',
        'createdAt': '2025-12-15',
        'description': 'المنتج وصل معيب',
      },
      {
        'id': 'TKT-2025-003',
        'title': 'استفسار عن الضمان',
        'category': 'استفسارات عامة',
        'priority': 'low',
        'status': 'open',
        'createdAt': '2025-12-10',
        'description': 'هل المنتج مغطى بالضمان؟',
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('🎫 تذاكر الدعم'),
        centerTitle: true,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Stats
            Padding(
              padding: const EdgeInsets.all(16),
              child: GridView.count(
                crossAxisCount: 4,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                children: [
                  _buildStatCard(context, 'الإجمالي', '${tickets.length}', Colors.grey),
                  _buildStatCard(context, 'مفتوحة', '${tickets.where((t) => t['status'] == 'open').length}', Colors.blue),
                  _buildStatCard(context, 'قيد المعالجة', '${tickets.where((t) => t['status'] == 'in_progress').length}', Colors.orange),
                  _buildStatCard(context, 'مغلقة', '${tickets.where((t) => t['status'] == 'resolved').length}', Colors.green),
                ],
              ),
            ),
            // Tickets List
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: tickets.map((ticket) {
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
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12),
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
                                        ticket['id'].toString(),
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        ticket['title'].toString(),
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(ticket['status'].toString()).withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          _getStatusLabel(ticket['status'].toString()),
                                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: _getStatusColor(ticket['status'].toString()),
                                            fontSize: 10,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        ticket['priority'] == 'high' ? '🔴' : ticket['priority'] == 'medium' ? '🟡' : '🟢',
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    ticket['category'].toString(),
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                                  ),
                                  Text(
                                    ticket['createdAt'].toString(),
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String label, String value, Color color) {
    return Container(
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(color: color),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'open':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'resolved':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'open':
        return 'مفتوح';
      case 'in_progress':
        return 'قيد المعالجة';
      case 'resolved':
        return 'مغلق';
      default:
        return status;
    }
  }
}
