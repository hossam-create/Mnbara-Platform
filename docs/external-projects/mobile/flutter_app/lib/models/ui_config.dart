/// UI Configuration Response Model
/// This model represents the dynamic UI configuration from the server
class UIConfigResponse {
  final int version;
  final String lastUpdated;
  final int cacheTtl;
  final UITheme theme;
  final List<UISection> sections;
  final List<Banner> banners;
  final Map<String, dynamic> appConfig;

  UIConfigResponse({
    required this.version,
    required this.lastUpdated,
    required this.cacheTtl,
    required this.theme,
    required this.sections,
    required this.banners,
    required this.appConfig,
  });

  factory UIConfigResponse.fromJson(Map<String, dynamic> json) {
    return UIConfigResponse(
      version: json['version'] ?? 1,
      lastUpdated: json['last_updated'] ?? '',
      cacheTtl: json['cache_ttl'] ?? 300,
      theme: UITheme.fromJson(json['theme'] ?? {}),
      sections: (json['sections'] as List? ?? [])
          .map((s) => UISection.fromJson(s))
          .toList(),
      banners: (json['banners'] as List? ?? [])
          .map((b) => Banner.fromJson(b))
          .toList(),
      appConfig: json['app_config'] ?? {},
    );
  }

  Map<String, dynamic> toJson() => {
    'version': version,
    'last_updated': lastUpdated,
    'cache_ttl': cacheTtl,
    'theme': theme.toJson(),
    'sections': sections.map((s) => s.toJson()).toList(),
    'banners': banners.map((b) => b.toJson()).toList(),
    'app_config': appConfig,
  };
}

/// Theme configuration
class UITheme {
  final String primaryColor;
  final String secondaryColor;
  final String accentColor;
  final String backgroundColor;
  final String surfaceColor;
  final String textPrimary;
  final String textSecondary;
  final String errorColor;
  final String successColor;
  final String fontFamilyAr;
  final String fontFamilyEn;
  final String borderRadius;

  UITheme({
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.backgroundColor,
    required this.surfaceColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.errorColor,
    required this.successColor,
    required this.fontFamilyAr,
    required this.fontFamilyEn,
    required this.borderRadius,
  });

  factory UITheme.fromJson(Map<String, dynamic> json) {
    return UITheme(
      primaryColor: json['primary_color'] ?? '#2563EB',
      secondaryColor: json['secondary_color'] ?? '#7C3AED',
      accentColor: json['accent_color'] ?? '#F59E0B',
      backgroundColor: json['background_color'] ?? '#FFFFFF',
      surfaceColor: json['surface_color'] ?? '#F3F4F6',
      textPrimary: json['text_primary'] ?? '#111827',
      textSecondary: json['text_secondary'] ?? '#6B7280',
      errorColor: json['error_color'] ?? '#EF4444',
      successColor: json['success_color'] ?? '#10B981',
      fontFamilyAr: json['font_family_ar'] ?? 'Cairo',
      fontFamilyEn: json['font_family_en'] ?? 'Inter',
      borderRadius: json['border_radius'] ?? '8px',
    );
  }

  Map<String, dynamic> toJson() => {
    'primary_color': primaryColor,
    'secondary_color': secondaryColor,
    'accent_color': accentColor,
    'background_color': backgroundColor,
    'surface_color': surfaceColor,
    'text_primary': textPrimary,
    'text_secondary': textSecondary,
    'error_color': errorColor,
    'success_color': successColor,
    'font_family_ar': fontFamilyAr,
    'font_family_en': fontFamilyEn,
    'border_radius': borderRadius,
  };
}

/// UI Section Model
class UISection {
  final String id;
  final String componentSlug;
  final int sortOrder;
  final bool isActive;
  final bool isVisible;
  final String? titleAr;
  final String? titleEn;
  final String? subtitleAr;
  final String? subtitleEn;
  final Map<String, dynamic> config;
  final String? backgroundColor;
  final String? textColor;
  final Map<String, dynamic>? padding;
  final Map<String, dynamic>? margin;
  final List<UISectionItem> items;

  UISection({
    required this.id,
    required this.componentSlug,
    required this.sortOrder,
    required this.isActive,
    required this.isVisible,
    this.titleAr,
    this.titleEn,
    this.subtitleAr,
    this.subtitleEn,
    required this.config,
    this.backgroundColor,
    this.textColor,
    this.padding,
    this.margin,
    required this.items,
  });

  /// Get title based on current language
  String? getTitle(String lang) => lang == 'ar' ? (titleAr ?? titleEn) : (titleEn ?? titleAr);
  
  /// Get subtitle based on current language
  String? getSubtitle(String lang) => lang == 'ar' ? (subtitleAr ?? subtitleEn) : (subtitleEn ?? subtitleAr);

  factory UISection.fromJson(Map<String, dynamic> json) {
    return UISection(
      id: json['id'] ?? '',
      componentSlug: json['component_slug'] ?? '',
      sortOrder: json['sort_order'] ?? 0,
      isActive: json['is_active'] ?? true,
      isVisible: json['is_visible'] ?? true,
      titleAr: json['title_ar'],
      titleEn: json['title_en'],
      subtitleAr: json['subtitle_ar'],
      subtitleEn: json['subtitle_en'],
      config: json['config'] ?? {},
      backgroundColor: json['background_color'],
      textColor: json['text_color'],
      padding: json['padding'],
      margin: json['margin'],
      items: (json['items'] as List? ?? [])
          .map((i) => UISectionItem.fromJson(i))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'component_slug': componentSlug,
    'sort_order': sortOrder,
    'is_active': isActive,
    'is_visible': isVisible,
    'title_ar': titleAr,
    'title_en': titleEn,
    'subtitle_ar': subtitleAr,
    'subtitle_en': subtitleEn,
    'config': config,
    'background_color': backgroundColor,
    'text_color': textColor,
    'padding': padding,
    'margin': margin,
    'items': items.map((i) => i.toJson()).toList(),
  };
}

/// UI Section Item Model
class UISectionItem {
  final String id;
  final int sortOrder;
  final bool isActive;
  final String? titleAr;
  final String? titleEn;
  final String? subtitleAr;
  final String? subtitleEn;
  final String? descriptionAr;
  final String? descriptionEn;
  final String? imageUrl;
  final String? imageUrlAr;
  final String? icon;
  final String? videoUrl;
  final ActionConfig? action;
  final BadgeConfig? badge;
  final double? price;
  final double? originalPrice;
  final String? currency;
  final ReferenceConfig? reference;
  final Map<String, dynamic>? customData;

  UISectionItem({
    required this.id,
    required this.sortOrder,
    required this.isActive,
    this.titleAr,
    this.titleEn,
    this.subtitleAr,
    this.subtitleEn,
    this.descriptionAr,
    this.descriptionEn,
    this.imageUrl,
    this.imageUrlAr,
    this.icon,
    this.videoUrl,
    this.action,
    this.badge,
    this.price,
    this.originalPrice,
    this.currency,
    this.reference,
    this.customData,
  });

  /// Get title based on current language
  String? getTitle(String lang) => lang == 'ar' ? (titleAr ?? titleEn) : (titleEn ?? titleAr);
  
  /// Get image based on current language
  String? getImage(String lang) => lang == 'ar' ? (imageUrlAr ?? imageUrl) : imageUrl;

  factory UISectionItem.fromJson(Map<String, dynamic> json) {
    return UISectionItem(
      id: json['id'] ?? '',
      sortOrder: json['sort_order'] ?? 0,
      isActive: json['is_active'] ?? true,
      titleAr: json['title_ar'],
      titleEn: json['title_en'],
      subtitleAr: json['subtitle_ar'],
      subtitleEn: json['subtitle_en'],
      descriptionAr: json['description_ar'],
      descriptionEn: json['description_en'],
      imageUrl: json['image_url'],
      imageUrlAr: json['image_url_ar'],
      icon: json['icon'],
      videoUrl: json['video_url'],
      action: json['action'] != null ? ActionConfig.fromJson(json['action']) : null,
      badge: json['badge'] != null ? BadgeConfig.fromJson(json['badge']) : null,
      price: json['price']?.toDouble(),
      originalPrice: json['original_price']?.toDouble(),
      currency: json['currency'],
      reference: json['reference'] != null ? ReferenceConfig.fromJson(json['reference']) : null,
      customData: json['custom_data'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'sort_order': sortOrder,
    'is_active': isActive,
    'title_ar': titleAr,
    'title_en': titleEn,
    'subtitle_ar': subtitleAr,
    'subtitle_en': subtitleEn,
    'description_ar': descriptionAr,
    'description_en': descriptionEn,
    'image_url': imageUrl,
    'image_url_ar': imageUrlAr,
    'icon': icon,
    'video_url': videoUrl,
    'action': action?.toJson(),
    'badge': badge?.toJson(),
    'price': price,
    'original_price': originalPrice,
    'currency': currency,
    'reference': reference?.toJson(),
    'custom_data': customData,
  };
}

/// Action configuration for links
class ActionConfig {
  final String type; // internal, external, deeplink, none
  final String? url;
  final String? screen;
  final Map<String, dynamic>? params;

  ActionConfig({
    required this.type,
    this.url,
    this.screen,
    this.params,
  });

  factory ActionConfig.fromJson(Map<String, dynamic> json) {
    return ActionConfig(
      type: json['type'] ?? 'none',
      url: json['url'],
      screen: json['screen'],
      params: json['params'],
    );
  }

  Map<String, dynamic> toJson() => {
    'type': type,
    'url': url,
    'screen': screen,
    'params': params,
  };
}

/// Badge configuration
class BadgeConfig {
  final String? textAr;
  final String? textEn;
  final String? color;

  BadgeConfig({this.textAr, this.textEn, this.color});

  String? getText(String lang) => lang == 'ar' ? (textAr ?? textEn) : (textEn ?? textAr);

  factory BadgeConfig.fromJson(Map<String, dynamic> json) {
    return BadgeConfig(
      textAr: json['text_ar'],
      textEn: json['text_en'],
      color: json['color'],
    );
  }

  Map<String, dynamic> toJson() => {
    'text_ar': textAr,
    'text_en': textEn,
    'color': color,
  };
}

/// Reference configuration
class ReferenceConfig {
  final String type; // product, category, service, blog, custom
  final String id;

  ReferenceConfig({required this.type, required this.id});

  factory ReferenceConfig.fromJson(Map<String, dynamic> json) {
    return ReferenceConfig(
      type: json['type'] ?? '',
      id: json['id'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'type': type, 'id': id};
}

/// Banner Model
class Banner {
  final String id;
  final String? titleAr;
  final String? titleEn;
  final String? subtitleAr;
  final String? subtitleEn;
  final String imageUrl;
  final String? imageUrlAr;
  final String? mobileImageUrl;
  final ActionConfig? action;
  final String position;
  final int sortOrder;

  Banner({
    required this.id,
    this.titleAr,
    this.titleEn,
    this.subtitleAr,
    this.subtitleEn,
    required this.imageUrl,
    this.imageUrlAr,
    this.mobileImageUrl,
    this.action,
    required this.position,
    required this.sortOrder,
  });

  String? getTitle(String lang) => lang == 'ar' ? (titleAr ?? titleEn) : (titleEn ?? titleAr);
  String getImage(String lang) => lang == 'ar' ? (imageUrlAr ?? imageUrl) : imageUrl;

  factory Banner.fromJson(Map<String, dynamic> json) {
    return Banner(
      id: json['id'] ?? '',
      titleAr: json['title_ar'],
      titleEn: json['title_en'],
      subtitleAr: json['subtitle_ar'],
      subtitleEn: json['subtitle_en'],
      imageUrl: json['image_url'] ?? '',
      imageUrlAr: json['image_url_ar'],
      mobileImageUrl: json['mobile_image_url'],
      action: json['action'] != null ? ActionConfig.fromJson(json['action']) : null,
      position: json['position'] ?? '',
      sortOrder: json['sort_order'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title_ar': titleAr,
    'title_en': titleEn,
    'subtitle_ar': subtitleAr,
    'subtitle_en': subtitleEn,
    'image_url': imageUrl,
    'image_url_ar': imageUrlAr,
    'mobile_image_url': mobileImageUrl,
    'action': action?.toJson(),
    'position': position,
    'sort_order': sortOrder,
  };
}
