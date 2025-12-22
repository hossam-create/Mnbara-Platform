import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { productsService } from '../../services/api';
import { Product, RootStackParamList } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 64;

interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

const CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', icon: '📱', slug: 'electronics' },
  { id: '2', name: 'Fashion', icon: '👕', slug: 'fashion' },
  { id: '3', name: 'Home', icon: '🏠', slug: 'home' },
  { id: '4', name: 'Sports', icon: '⚽', slug: 'sports' },
  { id: '5', name: 'Toys', icon: '🎮', slug: 'toys' },
  { id: '6', name: 'Books', icon: '📚', slug: 'books' },
  { id: '7', name: 'Beauty', icon: '💄', slug: 'beauty' },
  { id: '8', name: 'Auto', icon: '🚗', slug: 'auto' },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);


  const fetchData = useCallback(async () => {
    try {
      const [featuredRes, recoRes] = await Promise.all([
        productsService.getProducts({ limit: 5, sortBy: 'featured' }),
        productsService.getRecommendations(),
      ]);
      
      setFeaturedProducts(featuredRes.data || []);
      setRecommendations(recoRes.data || []);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Main', {
      screen: 'Search',
      params: { category: category.slug },
    } as any);
  };

  const handleProductPress = (productId: string) => {
    navigation.navigate('Product', { productId });
  };

  const handleSearchPress = () => {
    navigation.navigate('Main', { screen: 'Search' } as any);
  };

  const handleAuctionsPress = () => {
    navigation.navigate('Main', { screen: 'Auctions' } as any);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const renderFeaturedItem = ({ item, index }: { item: Product; index: number }) => (
    <TouchableOpacity
      style={styles.carouselItem}
      onPress={() => handleProductPress(item.id)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/300' }}
        style={styles.carouselImage}
        resizeMode="cover"
      />
      <View style={styles.carouselOverlay}>
        <View style={styles.carouselBadge}>
          <Text style={styles.carouselBadgeText}>Featured</Text>
        </View>
        <View style={styles.carouselContent}>
          <Text style={styles.carouselTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.carouselPrice}>
            {formatPrice(item.price, item.currency)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProductCard = (product: Product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => handleProductPress(product.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: product.images[0] || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.productPrice}>
          {formatPrice(product.price, product.currency)}
        </Text>
        <View style={styles.productCondition}>
          <Text style={styles.conditionText}>
            {product.condition.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = (category: Category) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(category)}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text style={styles.categoryName}>{category.name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.fullName?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={styles.subtitle}>What are you looking for today?</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.8}
        >
          <Text style={styles.searchPlaceholder}>🔍 Search products...</Text>
        </TouchableOpacity>

        {/* Featured Products Carousel */}
        {featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
            </View>
            <FlatList
              data={featuredProducts}
              renderItem={renderFeaturedItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={CAROUSEL_ITEM_WIDTH + 16}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContainer}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / (CAROUSEL_ITEM_WIDTH + 16)
                );
                setCarouselIndex(index);
              }}
            />
            {/* Carousel Indicators */}
            <View style={styles.carouselIndicators}>
              {featuredProducts.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === carouselIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(renderCategoryItem)}
          </View>
        </View>

        {/* Live Auctions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Auctions</Text>
            <TouchableOpacity onPress={handleAuctionsPress}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.auctionBanner}
            onPress={handleAuctionsPress}
            activeOpacity={0.8}
          >
            <Text style={styles.auctionIcon}>🔨</Text>
            <View style={styles.auctionBannerContent}>
              <Text style={styles.auctionBannerTitle}>
                Discover Live Auctions
              </Text>
              <Text style={styles.auctionBannerSubtitle}>
                Bid on unique items and get great deals
              </Text>
            </View>
            <Text style={styles.auctionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
          </View>
          {recommendations.length > 0 ? (
            <View style={styles.recommendationsGrid}>
              {recommendations.slice(0, 6).map(renderProductCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyText}>
                Browse products to get personalized recommendations
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  searchBar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Carousel styles
  carouselContainer: {
    paddingLeft: 0,
  },
  carouselItem: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 200,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: 16,
  },
  carouselBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  carouselContent: {
    alignItems: 'flex-start',
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  carouselPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  // Categories styles
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginHorizontal: -6,
  },
  categoryCard: {
    width: '23%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  // Auction banner styles
  auctionBanner: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  auctionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  auctionBannerContent: {
    flex: 1,
  },
  auctionBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  auctionBannerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  auctionArrow: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  // Recommendations grid styles
  recommendationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  productCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: '1.5%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F2F2F7',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  productCondition: {
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  // Empty state styles
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 24,
  },
});
