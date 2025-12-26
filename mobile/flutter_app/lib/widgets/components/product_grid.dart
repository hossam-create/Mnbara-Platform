import 'package:flutter/material.dart';
import '../../models/ui_config.dart';

class ProductGridWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;

  const ProductGridWidget({
    super.key,
    required this.section,
    required this.language,
    required this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    final config = section.config;
    final columns = (config['columns'] ?? 2) as int;
    final gap = (config['gap'] ?? 16).toDouble();
    final showPrice = config['show_price'] ?? true;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: columns,
          crossAxisSpacing: gap,
          mainAxisSpacing: gap,
          childAspectRatio: 0.7,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return GestureDetector(
            onTap: () => onItemTap(item),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  Expanded(
                    flex: 3,
                    child: Stack(
                      children: [
                        Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: item.getImage(language) != null
                              ? Image.network(
                                  item.getImage(language)!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Center(
                                    child: Icon(Icons.image, size: 40, color: Colors.grey),
                                  ),
                                )
                              : const Center(child: Icon(Icons.image, size: 40, color: Colors.grey)),
                        ),
                        // Badge
                        if (item.badge != null && item.badge!.getText(language) != null)
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _parseColor(item.badge!.color ?? '#EF4444'),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                item.badge!.getText(language)!,
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        // Wishlist button
                        Positioned(
                          top: 8,
                          left: 8,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
                            ),
                            child: const Icon(Icons.favorite_border, size: 18, color: Colors.grey),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Content
                  Expanded(
                    flex: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.getTitle(language) ?? '',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const Spacer(),
                          if (showPrice && item.price != null)
                            Row(
                              children: [
                                Text(
                                  '${item.price} ${item.currency ?? 'SAR'}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).primaryColor,
                                  ),
                                ),
                                if (item.originalPrice != null && item.originalPrice! > item.price!) ...[
                                  const SizedBox(width: 6),
                                  Text(
                                    '${item.originalPrice}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: Colors.grey,
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}
