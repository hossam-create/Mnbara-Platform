import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, List, Avatar, Button, Input, Select, Tabs,
  Drawer, Badge, Tag, Space, Typography, Spin,
  BackTop, Affix, Collapse, Row, Col
} from 'antd';
import {
  SearchOutlined, FilterOutlined, MenuOutlined,
  HomeOutlined, AppstoreOutlined, BarsOutlined,
  ArrowLeftOutlined, StarOutlined, EyeOutlined,
  ShoppingCartOutlined, HeartOutlined, ShareAltOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Title, Text } = Typography;

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

interface CategoryBrowserMobileProps {
  onCategorySelect?: (category: Category) => void;
  onProductSearch?: (category: Category, query?: string) => void;
  showBreadcrumb?: boolean;
  maxDepth?: number;
}

const CategoryBrowserMobile: React.FC<CategoryBrowserMobileProps> = ({
  onCategorySelect,
  onProductSearch,
  showBreadcrumb = true,
  maxDepth = 4
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'tree'>('grid');
  const [loading, setLoading] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('browse');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchCategories();
    fetchPopularCategories();
    loadSearchHistory();
  }, []);

  const fetchCategories = useCallback(async (parentId?: string) => {
    try {
      setLoading(true);
      const params: any = {
        includeStats: 'true',
        includeChildren: 'true',
        limit: 50
      };

      if (parentId) {
        params.parentId = parentId;
      }

      if (selectedLevel) {
        params.level = selectedLevel;
      }

      const response = await axios.get(`${API_BASE}/categories`, { params });
      
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, selectedLevel]);

  const fetchPopularCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories/popular`, {
        params: { limit: 10 }
      });
      
      if (response.data.success) {
        setPopularCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching popular categories:', error);
    }
  }, [API_BASE]);

  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('categorySearchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = (query: string) => {
    try {
      const updated = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
      setSearchHistory(updated);
      localStorage.setItem('categorySearchHistory', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    
    if (category.hasChildren) {
      // Navigate to subcategories
      setBreadcrumb([...breadcrumb, category]);
      fetchCategories(category.id);
    } else {
      // Select category for products
      if (onCategorySelect) {
        onCategorySelect(category);
      }
    }
  };

  const handleBreadcrumbClick = (category: Category, index: number) => {
    // Navigate back to this category level
    const newBreadcrumb = breadcrumb.slice(0, index);
    setBreadcrumb(newBreadcrumb);
    
    if (index === 0) {
      // Go to root
      fetchCategories();
    } else {
      fetchCategories(category.id);
    }
    
    setSelectedCategory(category);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      saveSearchHistory(query);
      
      const response = await axios.get(`${API_BASE}/categories/search`, {
        params: { q: query, limit: 20 }
      });
      
      if (response.data.success) {
        setCategories(response.data.data);
        setActiveTab('search');
      }
    } catch (error) {
      console.error('Error searching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (breadcrumb.length > 0) {
      const newBreadcrumb = [...breadcrumb];
      const previousCategory = newBreadcrumb.pop();
      setBreadcrumb(newBreadcrumb);
      
      if (newBreadcrumb.length === 0) {
        fetchCategories();
      } else {
        fetchCategories(previousCategory.id);
      }
      
      setSelectedCategory(previousCategory || null);
    }
  };

  const renderCategoryCard = (category: Category) => (
    <motion.div
      whileTap={{ scale: 0.95 }}
      key={category.id}
      onClick={() => handleCategoryClick(category)}
    >
      <Card
        className="category-card-mobile"
        size="small"
        hoverable
        cover={
          category.image ? (
            <div className="category-image-container">
              <img
                src={category.image}
                alt={category.name}
                className="category-image"
              />
              <div className="category-overlay">
                <Badge count={category.productCount} style={{ backgroundColor: '#EFB612' }} />
              </div>
            </div>
          ) : (
            <div className="category-placeholder">
              <AppstoreOutlined style={{ fontSize: 32, color: '#EFB612' }} />
              <Badge count={category.productCount} style={{ backgroundColor: '#EFB612' }} />
            </div>
          )
        }
        actions={[
          <EyeOutlined key="view" onClick={(e) => {
            e.stopPropagation();
            onProductSearch?.(category);
          }} />,
          <HeartOutlined key="favorite" />,
          <ShareAltOutlined key="share" />
        ]}
      >
        <Card.Meta
          title={
            <div className="category-title">
              <Text strong>{category.name}</Text>
              {category.nameAr && (
                <Text type="secondary" className="category-title-ar">
                  {category.nameAr}
                </Text>
              )}
            </div>
          }
          description={
            <div className="category-description">
              {category.description && (
                <Text type="secondary" ellipsis>
                  {category.description}
                </Text>
              )}
              <Space size="small" className="category-stats">
                {category.stats?.activeListings && (
                  <Tag color="green">
                    <ShoppingCartOutlined /> {category.stats.activeListings}
                  </Tag>
                )}
                {category.stats?.avgPrice && (
                  <Tag color="blue">
                    ${category.stats.avgPrice.toFixed(0)}
                  </Tag>
                )}
                {category.hasChildren && (
                  <Tag color="orange">
                    <AppstoreOutlined /> Subcategories
                  </Tag>
                )}
              </Space>
            </div>
          }
        />
      </Card>
    </motion.div>
  );

  const renderCategoryListItem = (category: Category) => (
    <List.Item
      key={category.id}
      onClick={() => handleCategoryClick(category)}
      className="category-list-item-mobile"
      extra={
        <Space>
          <Badge count={category.productCount} style={{ backgroundColor: '#EFB612' }} />
          {category.hasChildren && <AppstoreOutlined />}
        </Space>
      }
    >
      <List.Item.Meta
        avatar={
          category.image ? (
            <Avatar src={category.image} size={48} />
          ) : (
            <Avatar icon={<AppstoreOutlined />} size={48} style={{ backgroundColor: '#EFB612' }} />
          )
        }
        title={
          <div>
            <Text strong>{category.name}</Text>
            {category.nameAr && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {category.nameAr}
              </Text>
            )}
          </div>
        }
        description={
          <Space size="small">
            {category.stats?.activeListings && (
              <Tag color="green">{category.stats.activeListings} active</Tag>
            )}
            {category.stats?.avgPrice && (
              <Tag color="blue">${category.stats.avgPrice.toFixed(0)}</Tag>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  const renderTreeView = () => (
    <Collapse accordion>
      {categories.map(category => (
        <Panel
          key={category.id}
          header={
            <div className="tree-panel-header">
              <Space>
                <Text strong>{category.name}</Text>
                {category.nameAr && (
                  <Text type="secondary">{category.nameAr}</Text>
                )}
                <Badge count={category.productCount} style={{ backgroundColor: '#EFB612' }} />
              </Space>
            </div>
          }
        >
          {category.children && category.children.map(child => (
            <div key={child.id} className="tree-child">
              {renderCategoryCard(child)}
            </div>
          ))}
        </Panel>
      ))}
    </Collapse>
  );

  return (
    <div className="category-browser-mobile">
      {/* Header */}
      <Affix offsetTop={0}>
        <Card className="category-header-mobile" size="small">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                {(breadcrumb.length > 0 || selectedCategory) && (
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
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
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerVisible(true)}
                />
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setActiveTab('menu')}
                />
              </Space>
            </Col>
          </Row>
        </Card>
      </Affix>

      {/* Breadcrumb */}
      {showBreadcrumb && breadcrumb.length > 0 && (
        <Card className="breadcrumb-mobile" size="small">
          <Space wrap>
            <Button
              type="link"
              icon={<HomeOutlined />}
              onClick={() => {
                setBreadcrumb([]);
                fetchCategories();
                setSelectedCategory(null);
              }}
            >
              Home
            </Button>
            {breadcrumb.map((cat, index) => (
              <Button
                key={cat.id}
                type="link"
                onClick={() => handleBreadcrumbClick(cat, index)}
              >
                {cat.name}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="search-bar-mobile" size="small">
        <Search
          placeholder="Search categories..."
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
          loading={loading}
        />
      </Card>

      {/* Main Content */}
      <div className="category-content-mobile">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="small">
          <TabPane tab="Browse" key="browse">
            <Spin spinning={loading}>
              <div className="categories-container">
                {viewMode === 'grid' && (
                  <Row gutter={[8, 8]}>
                    {categories.map(category => (
                      <Col span={12} key={category.id}>
                        {renderCategoryCard(category)}
                      </Col>
                    ))}
                  </Row>
                )}
                {viewMode === 'list' && (
                  <List
                    dataSource={categories}
                    renderItem={renderCategoryListItem}
                    size="small"
                  />
                )}
                {viewMode === 'tree' && renderTreeView()}
              </div>
            </Spin>
          </TabPane>

          <TabPane tab="Popular" key="popular">
            <Row gutter={[8, 8]}>
              {popularCategories.map(category => (
                <Col span={12} key={category.id}>
                  {renderCategoryCard(category)}
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab="Recent" key="recent">
            <List
              dataSource={searchHistory}
              renderItem={(query) => (
                <List.Item
                  onClick={() => handleSearch(query)}
                  extra={<SearchOutlined />}
                >
                  <Text>{query}</Text>
                </List.Item>
              )}
              size="small"
            />
          </TabPane>
        </Tabs>
      </div>

      {/* View Mode Selector */}
      <Affix offsetBottom={20}>
        <Card className="view-mode-selector" size="small">
          <Space>
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              size="small"
              onClick={() => setViewMode('grid')}
            />
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<BarsOutlined />}
              size="small"
              onClick={() => setViewMode('list')}
            />
            <Button
              type={viewMode === 'tree' ? 'primary' : 'default'}
              icon={<MenuOutlined />}
              size="small"
              onClick={() => setViewMode('tree')}
            />
          </Space>
        </Card>
      </Affix>

      {/* Filter Drawer */}
      <Drawer
        title="Filters"
        placement="bottom"
        closable={false}
        onClose={() => setFilterDrawerVisible(false)}
        visible={filterDrawerVisible}
        height="60%"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Category Level</Text>
            <Select
              value={selectedLevel}
              onChange={setSelectedLevel}
              style={{ width: '100%', marginTop: 8 }}
              allowClear
              placeholder="Select level"
            >
              <Option value={1}>Level 1</Option>
              <Option value={2}>Level 2</Option>
              <Option value={3}>Level 3</Option>
              <Option value={4}>Level 4+</Option>
            </Select>
          </div>

          <div>
            <Text strong>Sort By</Text>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="name">Name</Option>
              <Option value="productCount">Products</Option>
              <Option value="activeListings">Active Listings</Option>
              <Option value="avgPrice">Average Price</Option>
            </Select>
          </div>

          <Button
            type="primary"
            block
            onClick={() => {
              fetchCategories();
              setFilterDrawerVisible(false);
            }}
          >
            Apply Filters
          </Button>
        </Space>
      </Drawer>

      <BackTop />
    </div>
  );
};

export default CategoryBrowserMobile;
