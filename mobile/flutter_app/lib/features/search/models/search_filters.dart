import 'package:equatable/equatable.dart';

enum ProductCondition {
  new,       // جديد
  used,      // مستعمل
  refurbished, // مجدد
  parts,     // قطع غيار
}

enum ShippingOption {
  free,          // شحن مجاني
  local,         // شحن محلي
  international, // شحن دولي
  express,       // شحن سريع
}

enum SortBy {
  relevance,     // الأكثر صلة
  priceLow,      // السعر: من الأقل
  priceHigh,     // السعر: من الأعلى
  newest,        // الأحدث
  rating,        // الأعلى تقييماً
  popularity,    // الأكثر شعبية
  distance,      // الأقرب
}

class SearchFilters extends Equatable {
  final String query;
  final String? categoryId;
  final double? minPrice;
  final double? maxPrice;
  final ProductCondition? condition;
  final bool freeShipping;
  final ShippingOption? shippingOption;
  final String? location;
  final double? radiusKm;
  final String? brand;
  final String? color;
  final String? size;
  final bool inStockOnly;
  final bool withDiscount;
  final double? minRating;
  final SortBy sortBy;
  final int page;
  final int limit;

  const SearchFilters({
    this.query = '',
    this.categoryId,
    this.minPrice,
    this.maxPrice,
    this.condition,
    this.freeShipping = false,
    this.shippingOption,
    this.location,
    this.radiusKm,
    this.brand,
    this.color,
    this.size,
    this.inStockOnly = false,
    this.withDiscount = false,
    this.minRating,
    this.sortBy = SortBy.relevance,
    this.page = 1,
    this.limit = 20,
  });

  SearchFilters copyWith({
    String? query,
    String? categoryId,
    double? minPrice,
    double? maxPrice,
    ProductCondition? condition,
    bool? freeShipping,
    ShippingOption? shippingOption,
    String? location,
    double? radiusKm,
    String? brand,
    String? color,
    String? size,
    bool? inStockOnly,
    bool? withDiscount,
    double? minRating,
    SortBy? sortBy,
    int? page,
    int? limit,
  }) {
    return SearchFilters(
      query: query ?? this.query,
      categoryId: categoryId ?? this.categoryId,
      minPrice: minPrice ?? this.minPrice,
      maxPrice: maxPrice ?? this.maxPrice,
      condition: condition ?? this.condition,
      freeShipping: freeShipping ?? this.freeShipping,
      shippingOption: shippingOption ?? this.shippingOption,
      location: location ?? this.location,
      radiusKm: radiusKm ?? this.radiusKm,
      brand: brand ?? this.brand,
      color: color ?? this.color,
      size: size ?? this.size,
      inStockOnly: inStockOnly ?? this.inStockOnly,
      withDiscount: withDiscount ?? this.withDiscount,
      minRating: minRating ?? this.minRating,
      sortBy: sortBy ?? this.sortBy,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }

  Map<String, dynamic> toJson() => {
        if (query.isNotEmpty) 'q': query,
        if (categoryId != null) 'category': categoryId,
        if (minPrice != null) 'min_price': minPrice,
        if (maxPrice != null) 'max_price': maxPrice,
        if (condition != null) 'condition': condition!.name,
        if (freeShipping) 'free_shipping': true,
        if (shippingOption != null) 'shipping': shippingOption!.name,
        if (location != null) 'location': location,
        if (radiusKm != null) 'radius': radiusKm,
        if (brand != null) 'brand': brand,
        if (color != null) 'color': color,
        if (size != null) 'size': size,
        if (inStockOnly) 'in_stock': true,
        if (withDiscount) 'with_discount': true,
        if (minRating != null) 'min_rating': minRating,
        'sort_by': sortBy.name,
        'page': page,
        'limit': limit,
      };

  @override
  List<Object?> get props => [
        query,
        categoryId,
        minPrice,
        maxPrice,
        condition,
        freeShipping,
        shippingOption,
        location,
        radiusKm,
        brand,
        color,
        size,
        inStockOnly,
        withDiscount,
        minRating,
        sortBy,
        page,
        limit,
      ];

  // Helper methods
  bool get hasFilters =>
      query.isNotEmpty ||
      categoryId != null ||
      minPrice != null ||
      maxPrice != null ||
      condition != null ||
      freeShipping ||
      shippingOption != null ||
      location != null ||
      radiusKm != null ||
      brand != null ||
      color != null ||
      size != null ||
      inStockOnly ||
      withDiscount ||
      minRating != null;

  String get filtersDescription {
    final filters = [];
    if (query.isNotEmpty) filters.add('بحث: "$query"');
    if (minPrice != null) filters.add('من ${minPrice!.toStringAsFixed(0)}');
    if (maxPrice != null) filters.add('إلى ${maxPrice!.toStringAsFixed(0)}');
    if (condition != null) filters.add('حالة: ${_conditionName(condition!)}');
    if (freeShipping) filters.add('شحن مجاني');
    if (location != null) filters.add('موقع: $location');
    return filters.join(' • ');
  }

  String _conditionName(ProductCondition condition) {
    switch (condition) {
      case ProductCondition.new:
        return 'جديد';
      case ProductCondition.used:
        return 'مستعمل';
      case ProductCondition.refurbished:
        return 'مجدد';
      case ProductCondition.parts:
        return 'قطع غيار';
    }
  }
}