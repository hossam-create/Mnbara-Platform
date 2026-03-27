import 'package:flutter/material.dart';
import '../../models/ui_config.dart';

class IconBarWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;

  const IconBarWidget({
    super.key,
    required this.section,
    required this.language,
    required this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    final config = section.config;
    final itemsPerRow = (config['items_per_row'] ?? 5) as int;
    final showLabels = config['show_labels'] ?? true;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: items.take(itemsPerRow).map((item) {
          return GestureDetector(
            onTap: () => onItemTap(item),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _parseColor(item.customData?['bg_color'] ?? '#F3F4F6'),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: item.icon != null
                        ? Text(item.icon!, style: const TextStyle(fontSize: 22))
                        : item.getImage(language) != null
                            ? Image.network(
                                item.getImage(language)!,
                                width: 28,
                                height: 28,
                              )
                            : const Icon(Icons.apps, size: 24),
                  ),
                ),
                if (showLabels) ...[
                  const SizedBox(height: 6),
                  Text(
                    item.getTitle(language) ?? '',
                    style: const TextStyle(fontSize: 11),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}
