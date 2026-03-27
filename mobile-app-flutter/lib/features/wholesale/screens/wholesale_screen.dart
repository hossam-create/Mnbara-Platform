// Wholesale Screen - شاشة البيع بالجملة
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/wholesale_service.dart';
import '../../../core/theme/app_colors.dart';

class WholesaleScreen extends ConsumerStatefulWidget {
  const WholesaleScreen({super.key});

  @override
  ConsumerState<WholesaleScreen> createState() => _WholesaleScreenState();
}

class _WholesaleScreenState extends ConsumerState<WholesaleScreen> {
  final List<WholesaleProduct> _products = [
    WholesaleProduct('1', 'iPhone 15 Pro', 3500, 100, '📱', [
      PriceTier(10, 3400), PriceTier(50, 3200), PriceTier(100, 3000),
    ]),
    WholesaleProduct('2', 'Samsung Galaxy S24', 2800, 150, '📱', [
      PriceTier(10, 2700), PriceTier(50, 2500), PriceTier(100, 2300),
    ]),
    WholesaleProduct('3', 'MacBook Pro M3', 8500, 50, '💻', [
      PriceTier(5, 8200), PriceTier(20, 7800), PriceTier(50, 7500),
    ]),
    WholesaleProduct('4', 'AirPods Pro', 850, 500, '🎧', [
      PriceTier(20, 800), PriceTier(100, 750), PriceTier(500, 700),
    ]),
  ];

  String _selectedCategory = 'الكل';
  final List<String> _categories = ['الكل', 'إلكترونيات', 'ملابس', 'أثاث', 'طعام'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('سوق الجملة'),
        actions: [
          IconButton(icon: const Icon(Icons.shopping_cart), onPressed: () {}),
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          // Categories
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final cat = _categories[index];
                final isSelected = cat == _selectedCategory;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(cat),
                    selected: isSelected,
                    onSelected: (selected) => setState(() => _selectedCategory = cat),
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black),
                  ),
                );
              },
            ),
          ),
          // Products
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _products.length,
              itemBuilder: (context, index) => _buildProductCard(_products[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(WholesaleProduct product) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(product.icon, style: const TextStyle(fontSize: 40)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(product.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text('متوفر: ${product.stock} قطعة', style: TextStyle(color: Colors.grey[600])),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('${product.basePrice} ر.س', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const Text('سعر القطعة', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),
            const Text('أسعار الجملة:', style: TextStyle(fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: product.tiers.map((tier) => Chip(
                label: Text('${tier.minQty}+ = ${tier.price} ر.س'),
                backgroundColor: AppColors.primary.withOpacity(0.1),
              )).toList(),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showInquiryDialog(product),
                    icon: const Icon(Icons.chat),
                    label: const Text('استفسار'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _showOrderDialog(product),
                    icon: const Icon(Icons.shopping_bag),
                    label: const Text('طلب'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showInquiryDialog(WholesaleProduct product) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('استفسار عن ${product.name}'),
        content: TextField(
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'اكتب استفسارك...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ElevatedButton(onPressed: () {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم إرسال الاستفسار ✓')));
          }, child: const Text('إرسال')),
        ],
      ),
    );
  }

  void _showOrderDialog(WholesaleProduct product) {
    int quantity = product.tiers.first.minQty;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final tier = product.tiers.lastWhere((t) => quantity >= t.minQty, orElse: () => product.tiers.first);
          final total = quantity * tier.price;
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('طلب ${product.name}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      onPressed: quantity > product.tiers.first.minQty ? () => setModalState(() => quantity -= 10) : null,
                      icon: const Icon(Icons.remove_circle_outline, size: 32),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      decoration: BoxDecoration(border: Border.all(color: Colors.grey), borderRadius: BorderRadius.circular(8)),
                      child: Text('$quantity', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    ),
                    IconButton(
                      onPressed: () => setModalState(() => quantity += 10),
                      icon: const Icon(Icons.add_circle_outline, size: 32),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text('السعر: ${tier.price} ر.س/قطعة', style: TextStyle(color: Colors.grey[600])),
                Text('الإجمالي: $total ر.س', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم إضافة الطلب ✓'), backgroundColor: Colors.green));
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 16)),
                    child: const Text('تأكيد الطلب', style: TextStyle(color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

class WholesaleProduct {
  final String id, name, icon;
  final double basePrice;
  final int stock;
  final List<PriceTier> tiers;
  WholesaleProduct(this.id, this.name, this.basePrice, this.stock, this.icon, this.tiers);
}

class PriceTier {
  final int minQty;
  final double price;
  PriceTier(this.minQty, this.price);
}
