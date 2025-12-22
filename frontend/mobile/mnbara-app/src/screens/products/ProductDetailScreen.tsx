import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Product, User } from '../../types';
import { productsService } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

interface ProductDetail extends Product {
  seller?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    ratingAvg: number;
    totalSales: number;
    memberSince: string;
  };
  viewsCount?: number;
  favoritesCount?: number;
  shippingInfo?: {
    freeShipping: boolean;
    estimatedDays: number;
    cost?: number;
  };
}

export const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const flatListRef = useRef<FlatList>(null);


  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productsService.getProduct(productId);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
      console.error('Failed to fetch product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    Alert.alert(
      'Added to Cart',
      `${quantity} x ${product?.title} added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        {
          text: 'View Cart',
          onPress: () => {
            // Navigate to cart - would need to add cart screen to navigation
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleBuyNow = () => {
    Alert.alert(
      'Proceed to Checkout',
      `Buy ${quantity} x ${product?.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Checkout',
          onPress: () => {
            // Navigate to checkout flow
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Call API to save/remove favorite
  };

  const handleContactSeller = () => {
    Alert.alert('Contact Seller', 'Messaging feature coming soon!');
  };

  const handleViewSellerProfile = () => {
    if (product?.seller) {
      // Navigate to seller profile
      Alert.alert('Seller Profile', `View ${product.seller.fullName}'s profile`);
    }
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      new: 'Brand New',
      like_new: 'Like New',
      good: 'Good',
      fair: 'Fair',
    };
    return labels[condition] || condition;
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Text key={`full-${i}`} style={styles.star}>★</Text>
        ))}
        {hasHalfStar && <Text style={styles.star}>★</Text>}
        {[...Array(emptyStars)].map((_, i) => (
          <Text key={`empty-${i}`} style={styles.starEmpty}>★</Text>
        ))}
        <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
      </View>
    );
  };

  const renderImageItem = ({ item, index }: { item: string; index: number }) => (
    <Image
      source={{ uri: item || 'https://via.placeholder.com/400' }}
      style={styles.carouselImage}
      resizeMode="cover"
    />
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProduct}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const images = product.images.length > 0 
    ? product.images 
    : ['https://via.placeholder.com/400'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <View style={styles.imageCarouselContainer}>
          <FlatList
            ref={flatListRef}
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          />
          
          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1}/{images.length}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Title & Price */}
          <Text style={styles.productTitle}>{product.title}</Text>
          <Text style={styles.productPrice}>
            {formatPrice(product.price, product.currency)}
          </Text>

          {/* Condition & Stats */}
          <View style={styles.metaRow}>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>
                {getConditionLabel(product.condition)}
              </Text>
            </View>
            {product.viewsCount !== undefined && (
              <Text style={styles.metaText}>
                👁 {product.viewsCount} views
              </Text>
            )}
            {product.favoritesCount !== undefined && (
              <Text style={styles.metaText}>
                ❤️ {product.favoritesCount} favorites
              </Text>
            )}
          </View>

          {/* Shipping Info */}
          {product.shippingInfo && (
            <View style={styles.shippingInfo}>
              <Text style={styles.shippingIcon}>📦</Text>
              <View>
                {product.shippingInfo.freeShipping ? (
                  <Text style={styles.freeShipping}>Free Shipping</Text>
                ) : (
                  <Text style={styles.shippingCost}>
                    Shipping: {formatPrice(product.shippingInfo.cost || 0)}
                  </Text>
                )}
                <Text style={styles.shippingDays}>
                  Estimated delivery: {product.shippingInfo.estimatedDays} days
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Seller Info */}
        {product.seller && (
          <TouchableOpacity 
            style={styles.sellerCard}
            onPress={handleViewSellerProfile}
            activeOpacity={0.8}
          >
            <Image
              source={{ 
                uri: product.seller.avatarUrl || 'https://via.placeholder.com/50' 
              }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller.fullName}</Text>
              {renderStars(product.seller.ratingAvg)}
              <Text style={styles.sellerMeta}>
                {product.seller.totalSales} sales • Member since {formatDate(product.seller.memberSince)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactSeller}
            >
              <Text style={styles.contactButtonText}>💬</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Attributes */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.attributesGrid}>
              {Object.entries(product.attributes).map(([key, value]) => (
                <View key={key} style={styles.attributeItem}>
                  <Text style={styles.attributeLabel}>
                    {key.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.attributeValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing for Action Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        {/* Quantity Selector */}
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Text style={[
              styles.quantityButtonText,
              quantity <= 1 && styles.quantityButtonDisabled
            ]}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowButton}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Image Carousel
  imageCarouselContainer: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#F2F2F7',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Product Info
  productInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    lineHeight: 26,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  conditionBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  conditionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
    marginRight: 12,
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  shippingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  freeShipping: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  shippingCost: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  shippingDays: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  // Seller Card
  sellerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  star: {
    fontSize: 14,
    color: '#FF9500',
  },
  starEmpty: {
    fontSize: 14,
    color: '#D1D1D6',
  },
  ratingText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  sellerMeta: {
    fontSize: 12,
    color: '#8E8E93',
  },
  contactButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 18,
  },
  // Sections
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 22,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  attributeItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  attributeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginRight: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  quantityButtonDisabled: {
    color: '#D1D1D6',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    minWidth: 24,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
