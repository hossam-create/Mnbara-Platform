import 'package:flutter/material.dart';
import '../../models/ui_config.dart';

class TestimonialsWidget extends StatelessWidget {
  final UISection section;
  final String language;

  const TestimonialsWidget({
    super.key,
    required this.section,
    required this.language,
  });

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    final config = section.config;
    final showRating = config['show_rating'] ?? true;

    return SizedBox(
      height: 200,
      child: PageView.builder(
        controller: PageController(viewportFraction: 0.9),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          final rating = item.customData?['rating'] ?? 5;

          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    // Avatar
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: Colors.grey[200],
                      backgroundImage: item.getImage(language) != null
                          ? NetworkImage(item.getImage(language)!)
                          : null,
                      child: item.getImage(language) == null
                          ? Text(
                              (item.getTitle(language) ?? 'U')[0].toUpperCase(),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    // Name & Rating
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.getTitle(language) ?? '',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          if (showRating)
                            Row(
                              children: List.generate(
                                5,
                                (i) => Icon(
                                  i < rating ? Icons.star : Icons.star_border,
                                  size: 16,
                                  color: Colors.amber,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    // Quote icon
                    Icon(Icons.format_quote, size: 32, color: Colors.grey[300]),
                  ],
                ),
                const SizedBox(height: 12),
                // Review text
                Expanded(
                  child: Text(
                    language == 'ar'
                        ? (item.descriptionAr ?? item.descriptionEn ?? '')
                        : (item.descriptionEn ?? item.descriptionAr ?? ''),
                    style: TextStyle(color: Colors.grey[700], fontSize: 13, height: 1.5),
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
