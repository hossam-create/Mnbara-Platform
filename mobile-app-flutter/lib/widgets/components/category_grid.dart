import 'package:flutter/material.dart';
import '../../models/ui_config.dart';

class CategoryGridWidget extends StatelessWidget {
  final UISection section;
  final String language;
  final Function(UISectionItem) onItemTap;

  const CategoryGridWidget({
    super.key,
    required this.section,
    required this.language,
    required this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    final config = section.config;
    final columns = (config['columns'] ?? 4) as int;
    final gap = (config['gap'] ?? 12).toDouble();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: columns,
          crossAxisSpacing: gap,
          mainAxisSpacing: gap,
          childAspectRatio: 0.85,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return GestureDetector(
            onTap: () => onItemTap(item),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon/Image Container
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: _parseColor(item.customData?['bg_color'] ?? '#EBF5FF'),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: item.icon != null
                        ? Text(item.icon!, style: const TextStyle(fontSize: 24))
                        : item.getImage(language) != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  item.getImage(language)!,
                                  width: 36,
                                  height: 36,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : const Icon(Icons.category, color: Colors.blue),
                  ),
                ),
                const SizedBox(height: 8),
                // Title
                Text(
                  item.getTitle(language) ?? '',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
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
