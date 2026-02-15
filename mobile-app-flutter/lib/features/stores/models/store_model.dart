import 'package:equatable/equatable.dart';

enum StoreTier {
  basic,    // متجر أساسي
  premium,  // متجر بريميوم
  enterprise // متجر مؤسسي
}

enum StoreStatus {
  pending,   // قيد المراجعة
  active,    // نشط
  suspended, // موقوف
  banned     // محظور
}

class Store extends Equatable {
  final String id;
  final String ownerId;
  final String nameAr;
  final String nameEn;
  final String? descriptionAr;
  final String? descriptionEn;
  final String? logo;
  final String? coverImage;
  final StoreTier tier;
  final StoreStatus status;
  final double rating;
  final int reviewCount;
  final int totalSales;
  final int totalProducts;
  final int totalFollowers;
  final DateTime joinDate;
  final DateTime? subscriptionEndDate;
  final List<String> categories;
  final Map<String, dynamic>? socialLinks;
  final Map<String, dynamic>? contactInfo;
  final List<String> targetRegions;
  final bool isVerified;
  final bool acceptsReturns;
  final int returnPeriodDays;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Store({
    required this.id,
    required this.ownerId,
    required this.nameAr,
    required this.nameEn,
    this.descriptionAr,
    this.descriptionEn,
    this.logo,
    this.coverImage,
    this.tier = StoreTier.basic,
    this.status = StoreStatus.pending,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.totalSales = 0,
    this.totalProducts = 0,
    this.totalFollowers = 0,
    required this.joinDate,
    this.subscriptionEndDate,
    this.categories = const [],
    this.socialLinks,
    this.contactInfo,
    this.targetRegions = const [],
    this.isVerified = false,
    this.acceptsReturns = true,
    this.returnPeriodDays = 14,
    required this.createdAt,
    this.updatedAt,
  });

  factory Store.fromJson(Map<String, dynamic> json) {
    return Store(
      id: json['id'],
      ownerId: json['ownerId'],
      nameAr: json['nameAr'],
      nameEn: json['nameEn'],
      descriptionAr: json['descriptionAr'],
      descriptionEn: json['descriptionEn'],
      logo: json['logo'],
      coverImage: json['coverImage'],
      tier: StoreTier.values.firstWhere((e) => e.name == json['tier'], orElse: () => StoreTier.basic),
      status: StoreStatus.values.firstWhere((e) => e.name == json['status'], orElse: () => StoreStatus.pending),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
      totalSales: json['totalSales'] ?? 0,
      totalProducts: json['totalProducts'] ?? 0,
      totalFollowers: json['totalFollowers'] ?? 0,
      joinDate: DateTime.parse(json['joinDate']),
      subscriptionEndDate: json['subscriptionEndDate'] != null ? DateTime.parse(json['subscriptionEndDate']) : null,
      categories: List<String>.from(json['categories'] ?? []),
      socialLinks: Map<String, dynamic>.from(json['socialLinks'] ?? {}),
      contactInfo: Map<String, dynamic>.from(json['contactInfo'] ?? {}),
      targetRegions: List<String>.from(json['targetRegions'] ?? []),
      isVerified: json['isVerified'] ?? false,
      acceptsReturns: json['acceptsReturns'] ?? true,
      returnPeriodDays: json['returnPeriodDays'] ?? 14,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ownerId': ownerId,
        'nameAr': nameAr,
        'nameEn': nameEn,
        'descriptionAr': descriptionAr,
        'descriptionEn': descriptionEn,
        'logo': logo,
        'coverImage': coverImage,
        'tier': tier.name,
        'status': status.name,
        'rating': rating,
        'reviewCount': reviewCount,
        'totalSales': totalSales,
        'totalProducts': totalProducts,
        'totalFollowers': totalFollowers,
        'joinDate': joinDate.toIso8601String(),
        'subscriptionEndDate': subscriptionEndDate?.toIso8601String(),
        'categories': categories,
        'socialLinks': socialLinks,
        'contactInfo': contactInfo,
        'targetRegions': targetRegions,
        'isVerified': isVerified,
        'acceptsReturns': acceptsReturns,
        'returnPeriodDays': returnPeriodDays,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, ownerId];

  // Helper methods
  bool get isActive => status == StoreStatus.active;
  bool get hasPremiumSubscription => tier != StoreTier.basic && subscriptionEndDate != null && subscriptionEndDate!.isAfter(DateTime.now());
  bool get canSell => isActive && (tier == StoreTier.basic || hasPremiumSubscription);
  String get displayName => nameAr;
}