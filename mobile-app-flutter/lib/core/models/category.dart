// Category Model - نموذج التصنيفات للفلاتر
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
    required this.productCount,
    this.subcategories,
    this.parentId,
    required this.level,
    required this.sortOrder,
    required this.isActive,
    required this.isFeatured,
    required this.searchKeywords,
    required this.createdAt,
    this.updatedAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      nameAr: json['nameAr'],
      nameEn: json['nameEn'],
      icon: json['icon'],
      image: json['image'],
      productCount: json['productCount'] ?? 0,
      subcategories: json['subcategories'] != null
          ? (json['subcategories'] as List)
              .map((item) => Category.fromJson(item))
              .toList()
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nameAr': nameAr,
      'nameEn': nameEn,
      'icon': icon,
      'image': image,
      'productCount': productCount,
      'subcategories': subcategories?.map((cat) => cat.toJson()).toList(),
      'parentId': parentId,
      'level': level,
      'sortOrder': sortOrder,
      'isActive': isActive,
      'isFeatured': isFeatured,
      'searchKeywords': searchKeywords,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  Category copyWith({
    String? id,
    String? nameAr,
    String? nameEn,
    String? icon,
    String? image,
    int? productCount,
    List<Category>? subcategories,
    String? parentId,
    int? level,
    int? sortOrder,
    bool? isActive,
    bool? isFeatured,
    List<String>? searchKeywords,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Category(
      id: id ?? this.id,
      nameAr: nameAr ?? this.nameAr,
      nameEn: nameEn ?? this.nameEn,
      icon: icon ?? this.icon,
      image: image ?? this.image,
      productCount: productCount ?? this.productCount,
      subcategories: subcategories ?? this.subcategories,
      parentId: parentId ?? this.parentId,
      level: level ?? this.level,
      sortOrder: sortOrder ?? this.sortOrder,
      isActive: isActive ?? this.isActive,
      isFeatured: isFeatured ?? this.isFeatured,
      searchKeywords: searchKeywords ?? this.searchKeywords,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        nameAr,
        nameEn,
        icon,
        image,
        productCount,
        subcategories,
        parentId,
        level,
        sortOrder,
        isActive,
        isFeatured,
        searchKeywords,
        createdAt,
        updatedAt,
      ];

  // Default Categories - التصنيفات الافتراضية
  static List<Category> get defaultCategories => [
        Category(
          id: 'electronics',
          nameAr: 'إلكترونيات',
          nameEn: 'Electronics',
          icon: '📱',
          productCount: 0,
          level: 1,
          sortOrder: 1,
          isActive: true,
          isFeatured: true,
          searchKeywords: ['موبايل', 'لابتوب', 'كمبيوتر', 'تلفزيون'],
          createdAt: DateTime.now(),
        ),
        Category(
          id: 'fashion',
          nameAr: 'موضة',
          nameEn: 'Fashion',
          icon: '👕',
          productCount: 0,
          level: 1,
          sortOrder: 2,
          isActive: true,
          isFeatured: true,
          searchKeywords: ['ملابس', 'أحذية', 'إكسسوارات', 'عطور'],
          createdAt: DateTime.now(),
        ),
        Category(
          id: 'home',
          nameAr: 'المنزل',
          nameEn: 'Home',
          icon: '🏠',
          productCount: 0,
          level: 1,
          sortOrder: 3,
          isActive: true,
          isFeatured: true,
          searchKeywords: ['أثاث', 'أجهزة', 'ديكور', 'مطبخ'],
          createdAt: DateTime.now(),
        ),
        Category(
          id: 'vehicles',
          nameAr: 'مركبات',
          nameEn: 'Vehicles',
          icon: '🚗',
          productCount: 0,
          level: 1,
          sortOrder: 4,
          isActive: true,
          isFeatured: true,
          searchKeywords: ['سيارات', 'دراجات', 'قطع غيار', 'إطارات'],
          createdAt: DateTime.now(),
        ),
        Category(
          id: 'sports',
          nameAr: 'رياضة',
          nameEn: 'Sports',
          icon: '⚽',
          productCount: 0,
          level: 1,
          sortOrder: 5,
          isActive: true,
          isFeatured: true,
          searchKeywords: ['ملابس رياضية', 'معدات', 'أحذية رياضية', 'لياقة'],
          createdAt: DateTime.now(),
        ),
      ];
}