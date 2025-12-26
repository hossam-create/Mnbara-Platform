import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Button, Space, Typography, Badge, Avatar,
  Drawer, Tabs, Row, Col, Spin, Empty, BackTop,
  FloatButton, Tooltip, Segmented, Slider
} from 'antd';
import {
  HomeOutlined, SearchOutlined, FilterOutlined,
  HeartOutlined, ShoppingCartOutlined, UserOutlined,
  MenuOutlined, AppstoreOutlined, ArrowLeftOutlined,
  StarOutlined, EyeOutlined, ShareAltOutlined,
  PlusOutlined, MinusOutlined, ReloadOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  image?: string;
  level: number;
  productCount: number;
  isActive: boolean;
  hasChildren: boolean;
  stats?: {
    activeListings: number;
    avgPrice: number;
    viewCount: number;
  };
  children?: Category[];
}

interface TouchNavigationProps {
  categories: Category[];
  onCategorySelect?: (category: Category) => void;
  onProductSearch?: (category: Category, query?: string) => void;
  showQuickActions?: boolean;
  enableGestures?: boolean;
}

const TouchNavigation: React.FC<TouchNavigationProps> = ({
  categories,
  onCategorySelect,
  onProductSearch,
  showQuickActions = true,
  enableGestures = true
}) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Category[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [viewScale, setViewScale] = useState(1);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  // Swipe handlers for navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    onSwipedUp: () => handleSwipe('up'),
    onSwipedDown: () => handleSwipe('down'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!enableGestures) return;

    setSwipeDirection(direction);
    setTimeout(() => setSwipeDirection(null), 300);

    switch (direction) {
      case 'right':
        // Go back in navigation
        handleBack();
        break;
      case 'left':
        // Open drawer or go to next level
        if (selectedCategory?.hasChildren) {
          handleCategorySelect(selectedCategory);
        } else {
          setIsDrawerOpen(true);
        }
        break;
      case 'up':
        // Show quick actions
        setQuickActionsVisible(!quickActionsVisible);
        break;
      case 'down':
        // Refresh or search
        handleRefresh();
        break;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleSwipe('left');
    }
    if (isRightSwipe) {
      handleSwipe('right');
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setNavigationHistory([...navigationHistory, category]);
    
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const handleBack = () => {
    if (navigationHistory.length > 0) {
      const newHistory = [...navigationHistory];
      const previousCategory = newHistory.pop();
      setNavigationHistory(newHistory);
      setSelectedCategory(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => setLoading(false), 1000);
  };

  const handlePinchZoom = (scale: number) => {
    setViewScale(Math.min(Math.max(scale, 0.5), 2));
  };

  const renderTouchableCategory = (category: Category, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClasses = {
      small: 'category-touch-small',
      medium: 'category-touch-medium',
      large: 'category-touch-large'
    };

    return (
      <motion.div
        key={category.id}
        className={`category-touchable ${sizeClasses[size]}`}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => handleCategorySelect(category)}
        onPanEnd={(event, info: PanInfo) => {
          if (Math.abs(info.offset.x) > 50) {
            handleSwipe(info.offset.x > 0 ? 'right' : 'left');
          }
        }}
      >
        <Card
          className="category-touch-card"
          size="small"
          hoverable
          cover={
            <div className="category-touch-image">
              {category.image ? (
                <img src={category.image} alt={category.name} />
              ) : (
                <div className="category-touch-placeholder">
                  <AppstoreOutlined style={{ fontSize: size === 'large' ? 48 : 32, color: '#EFB612' }} />
                </div>
              )}
              <div className="category-touch-overlay">
                <Badge count={category.productCount} style={{ backgroundColor: '#EFB612' }} />
              </div>
            </div>
          }
          actions={[
            <Tooltip title="View Products">
              <EyeOutlined onClick={(e) => {
                e.stopPropagation();
                onProductSearch?.(category);
              }} />
            </Tooltip>,
            <Tooltip title="Add to Favorites">
              <HeartOutlined onClick={(e) => e.stopPropagation()} />
            </Tooltip>,
            <Tooltip title="Share">
              <ShareAltOutlined onClick={(e) => e.stopPropagation()} />
            </Tooltip>
          ]}
        >
          <Card.Meta
            title={
              <div className="category-touch-title">
                <Text strong>{category.name}</Text>
                {category.nameAr && (
                  <Text type="secondary" className="category-touch-arabic">
                    {category.nameAr}
                  </Text>
                )}
              </div>
            }
            description={
              <Space direction="vertical" size="small">
                {category.description && (
                  <Text type="secondary" ellipsis>
                    {category.description}
                  </Text>
                )}
                <Space size="small">
                  {category.stats?.activeListings && (
                    <Badge count={category.stats.activeListings} style={{ backgroundColor: '#52c41a' }} />
                  )}
                  {category.stats?.avgPrice && (
                    <Tag color="blue">${category.stats.avgPrice.toFixed(0)}</Tag>
                  )}
                  {category.hasChildren && (
                    <Tag color="orange">
                      <AppstoreOutlined /> Subcategories
                    </Tag>
                  )}
                </Space>
              </Space>
            }
          />
        </Card>
      </motion.div>
    );
  };

  const renderQuickActions = () => (
    <AnimatePresence>
      {quickActionsVisible && (
        <motion.div
          className="quick-actions-panel"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Card className="quick-actions-card">
            <Space wrap>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                size="large"
                onClick={() => setActiveTab('search')}
              >
                Search
              </Button>
              <Button
                icon={<FilterOutlined />}
                size="large"
                onClick={() => setIsDrawerOpen(true)}
              >
                Filter
              </Button>
              <Button
                icon={<HeartOutlined />}
                size="large"
              >
                Favorites
              </Button>
              <Button
                icon={<ShoppingCartOutlined />}
                size="large"
              >
                Cart
              </Button>
              <Button
                icon={<UserOutlined />}
                size="large"
              >
                Profile
              </Button>
            </Space>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderBottomNavigation = () => (
    <div className="touch-bottom-nav">
      <Space size="large">
        <Button
          type={activeTab === 'browse' ? 'primary' : 'default'}
          icon={<HomeOutlined />}
          size="large"
          onClick={() => setActiveTab('browse')}
        />
        <Button
          type={activeTab === 'search' ? 'primary' : 'default'}
          icon={<SearchOutlined />}
          size="large"
          onClick={() => setActiveTab('search')}
        />
        <Button
          type={activeTab === 'favorites' ? 'primary' : 'default'}
          icon={<HeartOutlined />}
          size="large"
          onClick={() => setActiveTab('favorites')}
        />
        <Button
          type={activeTab === 'cart' ? 'primary' : 'default'}
          icon={<ShoppingCartOutlined />}
          size="large"
          onClick={() => setActiveTab('cart')}
        />
        <Button
          type={activeTab === 'profile' ? 'primary' : 'default'}
          icon={<UserOutlined />}
          size="large"
          onClick={() => setActiveTab('profile')}
        />
      </Space>
    </div>
  );

  const renderGestureIndicators = () => (
    <AnimatePresence>
      {swipeDirection && (
        <motion.div
          className={`gesture-indicator gesture-${swipeDirection}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
        >
          {swipeDirection === 'left' && <ArrowLeftOutlined />}
          {swipeDirection === 'right' && <ArrowLeftOutlined />}
          {swipeDirection === 'up' && <PlusOutlined />}
          {swipeDirection === 'down' && <MinusOutlined />}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      ref={containerRef}
      className="touch-navigation-container"
      {...swipeHandlers}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `scale(${viewScale})` }}
    >
      {/* Header with gesture support */}
      <Card className="touch-header" size="small">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              {navigationHistory.length > 0 && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  size="large"
                  onClick={handleBack}
                />
              )}
              <Title level={4} style={{ margin: 0 }}>
                {selectedCategory ? selectedCategory.name : 'Categories'}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="text"
                icon={<ReloadOutlined />}
                size="large"
                onClick={handleRefresh}
                loading={loading}
              />
              <Button
                type="text"
                icon={<MenuOutlined />}
                size="large"
                onClick={() => setIsDrawerOpen(true)}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <div className="touch-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          <TabPane tab="Browse" key="browse">
            <Spin spinning={loading}>
              <Row gutter={[12, 12]}>
                {categories.map(category => (
                  <Col xs={12} sm={8} md={6} key={category.id}>
                    {renderTouchableCategory(category, 'medium')}
                  </Col>
                ))}
              </Row>
            </Spin>
          </TabPane>

          <TabPane tab="Search" key="search">
            <Card className="touch-search-card">
              <input
                type="text"
                placeholder="Search categories..."
                className="touch-search-input"
                style={{ width: '100%', padding: '12px', fontSize: '16px' }}
              />
            </Card>
          </TabPane>

          <TabPane tab="Favorites" key="favorites">
            <Empty description="No favorites yet" />
          </TabPane>

          <TabPane tab="Cart" key="cart">
            <Empty description="Cart is empty" />
          </TabPane>
        </Tabs>
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && renderQuickActions()}

      {/* Bottom Navigation */}
      {renderBottomNavigation()}

      {/* Gesture Indicators */}
      {renderGestureIndicators()}

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <Space direction="vertical">
          <Button
            type="primary"
            shape="circle"
            icon={<PlusOutlined />}
            onClick={() => handlePinchZoom(viewScale + 0.1)}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<MinusOutlined />}
            onClick={() => handlePinchZoom(viewScale - 0.1)}
          />
        </Space>
      </div>

      {/* Side Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        width="80%"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block size="large" icon={<FilterOutlined />}>
            Filters
          </Button>
          <Button block size="large" icon={<StarOutlined />}>
            Popular
          </Button>
          <Button block size="large" icon={<EyeOutlined />}>
            Recently Viewed
          </Button>
          <Button block size="large" icon={<UserOutlined />}>
            Account Settings
          </Button>
        </Space>
      </Drawer>

      <BackTop />
    </div>
  );
};

export default TouchNavigation;
