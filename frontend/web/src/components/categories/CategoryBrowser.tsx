import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input, Tree, Select, Spin, Card, Row, Col, Button, AutoComplete, Breadcrumb, Typography, Tag, Divider } from 'antd';
import { SearchOutlined, LoadingOutlined, HomeOutlined, RightOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  level: number;
  depth?: number;
  path?: string;
  parentId?: string | null;
  displayOrder: number;
  isActive: boolean;
  hasChildren: boolean;
  productCount: number;
  children?: Category[];
  stats?: {
    productCount: number;
    activeListings: number;
    avgPrice: number;
  };
}

interface CategoryStats {
  productCount: number;
  activeListings: number;
  soldProducts: number;
  avgPrice: number;
  totalRevenue: number;
  viewCount: number;
}

const CategoryBrowser: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [popularCategories, setPopularCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Category[]>([]);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<{ value: string; label: string }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'tree' | 'list'>('grid');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'displayOrder' | 'name' | 'productCount'>('displayOrder');
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);

  // API base URL
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Fetch root categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/categories`, {
        params: {
          level: selectedLevel || undefined,
          includeStats: 'true',
          includeChildren: viewMode === 'grid' ? 'true' : 'false',
          limit: viewMode === 'grid' ? 100 : 50,
          sort: sortBy
        }
      });
      
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, selectedLevel, viewMode, sortBy]);

  // Fetch category tree
  const fetchCategoryTree = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/categories/tree`, {
        params: {
          maxDepth: 3,
          includeStats: 'true'
        }
      });
      
      if (response.data.success) {
        setCategoryTree(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching category tree:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Fetch popular categories
  const fetchPopularCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories/popular`, {
        params: { limit: 20 }
      });
      
      if (response.data.success) {
        setPopularCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching popular categories:', error);
    }
  }, [API_BASE]);

  // Search categories
  const searchCategories = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setAutoCompleteOptions([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axios.get(`${API_BASE}/categories/search`, {
        params: { q: query, limit: 10 }
      });
      
      if (response.data.success) {
        setSearchResults(response.data.data);
        setAutoCompleteOptions(
          response.data.data.map((cat: Category) => ({
            value: cat.slug,
            label: `${cat.name}${cat.nameAr ? ` / ${cat.nameAr}` : ''} (${cat.productCount} products)`
          }))
        );
      }
    } catch (error) {
      console.error('Error searching categories:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [API_BASE]);

  // Get category details
  const getCategoryDetails = useCallback(async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/categories/${categoryId}`, {
        params: {
          includePath: 'true',
          includeStats: 'true',
          includeChildren: 'true'
        }
      });
      
      if (response.data.success) {
        setSelectedCategory(response.data.data);
        setBreadcrumb(response.data.data.breadcrumb || []);
        setCategoryStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching category details:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  // Get category path
  const getCategoryPath = useCallback(async (categoryId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/categories/${categoryId}/path`);
      
      if (response.data.success) {
        setBreadcrumb(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching category path:', error);
    }
  }, [API_BASE]);

  // Load initial data
  useEffect(() => {
    fetchCategories();
    fetchCategoryTree();
    fetchPopularCategories();
  }, [fetchCategories, fetchCategoryTree, fetchPopularCategories]);

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCategories(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchCategories]);

  // Build tree data for Ant Design Tree component
  const treeData = useMemo(() => {
    const buildTreeNode = (category: Category): any => ({
      title: (
        <div className="category-tree-node">
          <span className="category-name">
            {category.name}
            {category.nameAr && <span className="category-name-ar"> / {category.nameAr}</span>}
          </span>
          <Tag size="small" color="blue">{category.productCount}</Tag>
        </div>
      ),
      key: category.id,
      children: category.children?.map(buildTreeNode) || []
    });

    return categoryTree.map(buildTreeNode);
  }, [categoryTree]);

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    getCategoryDetails(category.id);
    getCategoryPath(category.id);
  };

  // Handle tree node select
  const handleTreeNodeSelect = (selectedKeys: string[], info: any) => {
    if (selectedKeys.length > 0) {
      const categoryId = selectedKeys[0];
      getCategoryDetails(categoryId);
    }
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  // Handle autocomplete select
  const handleAutoCompleteSelect = (value: string) => {
    const category = searchResults.find(cat => cat.slug === value);
    if (category) {
      handleCategorySelect(category);
    }
  };

  // Render category card
  const renderCategoryCard = (category: Category) => (
    <motion.div
      key={category.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        hoverable
        className="category-card"
        onClick={() => handleCategorySelect(category)}
        size="small"
      >
        <div className="category-card-content">
          <Title level={5} className="category-title">
            {category.name}
            {category.nameAr && <span className="category-title-ar">{category.nameAr}</span>}
          </Title>
          <div className="category-stats">
            <Tag color="blue">{category.productCount} products</Tag>
            {category.stats && (
              <>
                <Tag color="green">{category.stats.activeListings} active</Tag>
                <Tag color="orange">${category.stats.avgPrice.toFixed(0)} avg</Tag>
              </>
            )}
          </div>
          {category.hasChildren && (
            <Text type="secondary" className="category-children-indicator">
              Has subcategories
            </Text>
          )}
        </div>
      </Card>
    </motion.div>
  );

  // Render breadcrumb
  const renderBreadcrumb = () => (
    <Breadcrumb className="category-breadcrumb">
      <Breadcrumb.Item>
        <Button type="link" icon={<HomeOutlined />} onClick={() => setSelectedCategory(null)}>
          Home
        </Button>
      </Breadcrumb.Item>
      {breadcrumb.map((cat, index) => (
        <Breadcrumb.Item key={cat.id}>
          <Button 
            type="link" 
            onClick={() => handleCategorySelect(cat)}
            className={selectedCategory?.id === cat.id ? 'active' : ''}
          >
            {cat.name}
          </Button>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );

  return (
    <div className="category-browser">
      {/* Header */}
      <div className="category-browser-header">
        <Title level={2}>Browse Categories</Title>
        <Text type="secondary">Explore our extensive catalog of products</Text>
      </div>

      {/* Search Bar */}
      <Card className="search-section">
        <AutoComplete
          className="category-search"
          options={autoCompleteOptions}
          onSelect={handleAutoCompleteSelect}
          onSearch={handleSearch}
          placeholder="Search categories..."
          style={{ width: '100%' }}
        >
          <Input.Search
            prefix={<SearchOutlined />}
            placeholder="Search categories..."
            loading={searchLoading}
            enterButton
          />
        </AutoComplete>
      </Card>

      {/* Filters */}
      <Card className="filters-section">
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Text strong>View:</Text>
            <Select value={viewMode} onChange={setViewMode} style={{ marginLeft: 8 }}>
              <Option value="grid">Grid</Option>
              <Option value="tree">Tree</Option>
              <Option value="list">List</Option>
            </Select>
          </Col>
          <Col>
            <Text strong>Level:</Text>
            <Select 
              value={selectedLevel} 
              onChange={setSelectedLevel} 
              style={{ marginLeft: 8 }}
              allowClear
              placeholder="All levels"
            >
              <Option value={1}>Level 1</Option>
              <Option value={2}>Level 2</Option>
              <Option value={3}>Level 3</Option>
              <Option value={4}>Level 4+</Option>
            </Select>
          </Col>
          <Col>
            <Text strong>Sort by:</Text>
            <Select value={sortBy} onChange={setSortBy} style={{ marginLeft: 8 }}>
              <Option value="displayOrder">Order</Option>
              <Option value="name">Name</Option>
              <Option value="productCount">Products</Option>
            </Select>
          </Col>
          <Col flex="auto">
            <Button onClick={fetchCategories} loading={loading}>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <Card className="breadcrumb-section">
          {renderBreadcrumb()}
        </Card>
      )}

      {/* Main Content */}
      <div className="category-content">
        <AnimatePresence mode="wait">
          {selectedCategory ? (
            // Category Details View
            <motion.div
              key="category-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="category-details">
                <Row gutter={[24, 24]}>
                  <Col span={24}>
                    <Title level={3}>{selectedCategory.name}</Title>
                    {selectedCategory.nameAr && (
                      <Title level={4} type="secondary">{selectedCategory.nameAr}</Title>
                    )}
                    {selectedCategory.description && (
                      <Text>{selectedCategory.description}</Text>
                    )}
                  </Col>
                  
                  {categoryStats && (
                    <Col span={24}>
                      <Row gutter={[16, 16]}>
                        <Col span={6}>
                          <Card size="small">
                            <Text strong>Total Products</Text>
                            <Title level={4}>{categoryStats.productCount.toLocaleString()}</Title>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small">
                            <Text strong>Active Listings</Text>
                            <Title level={4}>{categoryStats.activeListings.toLocaleString()}</Title>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small">
                            <Text strong>Average Price</Text>
                            <Title level={4}>${categoryStats.avgPrice.toFixed(2)}</Title>
                          </Card>
                        </Col>
                        <Col span={6}>
                          <Card size="small">
                            <Text strong>Total Revenue</Text>
                            <Title level={4}>${categoryStats.totalRevenue.toLocaleString()}</Title>
                          </Card>
                        </Col>
                      </Row>
                    </Col>
                  )}

                  {selectedCategory.children && selectedCategory.children.length > 0 && (
                    <Col span={24}>
                      <Divider>Subcategories</Divider>
                      <Row gutter={[16, 16]}>
                        {selectedCategory.children.map(renderCategoryCard)}
                      </Row>
                    </Col>
                  )}
                </Row>
              </Card>
            </motion.div>
          ) : (
            // Category List View
            <motion.div
              key="category-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === 'grid' && (
                <Row gutter={[16, 16]}>
                  {categories.map(renderCategoryCard)}
                </Row>
              )}

              {viewMode === 'tree' && (
                <Card className="tree-view">
                  <Tree
                    treeData={treeData}
                    onSelect={handleTreeNodeSelect}
                    expandedKeys={expandedKeys}
                    onExpand={setExpandedKeys}
                    showLine
                    showIcon={false}
                  />
                </Card>
              )}

              {viewMode === 'list' && (
                <div className="list-view">
                  {categories.map(category => (
                    <Card
                      key={category.id}
                      className="category-list-item"
                      hoverable
                      onClick={() => handleCategorySelect(category)}
                    >
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Title level={5} className="category-name">
                            {category.name}
                            {category.nameAr && <span className="category-name-ar"> / {category.nameAr}</span>}
                          </Title>
                        </Col>
                        <Col>
                          <Tag color="blue">{category.productCount} products</Tag>
                          {category.hasChildren && <Tag color="green">Has subcategories</Tag>}
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popular Categories */}
      {!selectedCategory && popularCategories.length > 0 && (
        <Card className="popular-categories" title="Popular Categories">
          <Row gutter={[16, 16]}>
            {popularCategories.slice(0, 12).map(category => (
              <Col key={category.id} span={6}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => handleCategorySelect(category)}
                  className="popular-category-card"
                >
                  <Text strong>{category.name}</Text>
                  <br />
                  <Tag size="small">{category.productCount} products</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {loading && (
        <div className="loading-overlay">
          <Spin size="large" indicator={<LoadingOutlined />} />
        </div>
      )}
    </div>
  );
};

export default CategoryBrowser;
