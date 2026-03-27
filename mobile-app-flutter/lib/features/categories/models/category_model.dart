import 'package:equatable/equatable.dart';

class Category extends Equatable {
  final String id;
  final String nameAr;
  final String nameEn;
  final String? icon;
  final String? image;
  final int productCount;
  final List<Category>? subcategories;
  final String? parentId;
  final int level;
  final int sortOrder;
  final bool isActive;
  final bool isFeatured;
  final List<String> searchKeywords;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Category({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    this.icon,
    this.image,
    this.productCount = 0,
    this.subcategories,
    this.parentId,
    this.level = 1,
    this.sortOrder = 0,
    this.isActive = true,
    this.isFeatured = false,
    this.searchKeywords = const [],
    required this.createdAt,
    this.updatedAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      nameAr: json['nameAr'] ?? json['name'],
      nameEn: json['nameEn'] ?? json['name'],
      icon: json['icon'],
      image: json['image'],
      productCount: json['productCount'] ?? 0,
      subcategories: json['subcategories'] != null
          ? (json['subcategories'] as List).map((e) => Category.fromJson(e)).toList()
          : null,
      parentId: json['parentId'],
      level: json['level'] ?? 1,
      sortOrder: json['sortOrder'] ?? 0,
      isActive: json['isActive'] ?? true,
      isFeatured: json['isFeatured'] ?? false,
      searchKeywords: List<String>.from(json['searchKeywords'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nameAr': nameAr,
        'nameEn': nameEn,
        'icon': icon,
        'image': image,
        'productCount': productCount,
        'subcategories': subcategories?.map((e) => e.toJson()).toList(),
        'parentId': parentId,
        'level': level,
        'sortOrder': sortOrder,
        'isActive': isActive,
        'isFeatured': isFeatured,
        'searchKeywords': searchKeywords,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, nameAr, nameEn];

  // Helper methods
  bool get hasSubcategories => subcategories != null && subcategories!.isNotEmpty;
  bool get isRootCategory => parentId == null;
  String get displayName => nameAr; // Use Arabic name by default
}