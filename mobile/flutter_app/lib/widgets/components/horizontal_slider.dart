import 'package:flutter/material.dart';
import '../../models/ui_config.dart';

class HorizontalSliderWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;

  const HorizontalSliderWidget({
    super.key,
    required this.section,
    required this.language,
    required this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    final config = section.config;
    final itemWidth = (config['item_width'] ?? 120).toDouble();
    final itemHeight = (config['item_height'] ?? 150).toDouble();
    final spacing = (config['spacing'] ?? 12).toDouble();

    return SizedBox(
      height: itemHeight + 60,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, __) => SizedBox(width: spacing),
        itemBuilder: (context, index) {
          final item = items[index];
          return GestureDetector(
            onTap: () => onItemTap(item),
            child: SizedBox(
              width: itemWidth,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  Container(
                    width: itemWidth,
                    height: itemHeight,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.grey[200],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: item.getImage(language) != null
                        ? Image.network(
                            item.getImage(language)!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.image, size: 40, color: Colors.grey),
                          )
                        : const Icon(Icons.image, size: 40, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  // Title
                  if (item.getTitle(language) != null)
                    Text(
                      item.getTitle(language)!,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  // Price
                  if (item.price != null)
                    Text(
                      '${item.price} ${item.currency ?? 'SAR'}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                  // Badge
                  if (item.badge != null && item.badge!.getText(language) != null)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: _parseColor(item.badge!.color ?? '#EF4444'),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        item.badge!.getText(language)!,
                        style: const TextStyle(color: Colors.white, fontSize: 10),
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
