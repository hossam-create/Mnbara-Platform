import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Table, Select, DatePicker,
  Typography, Progress, Tag, Space, Button, Tooltip,
  Alert, Spin, Empty, Divider
} from 'antd';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUpOutlined, TrendingDownOutlined,
  EyeOutlined, ShoppingCartOutlined, DollarOutlined,
  UserOutlined, ReloadOutlined, DownloadOutlined,
  FilterOutlined, CalendarOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface CategoryAnalytics {
  overview: {
    totalCategories: number;
    activeCategories: number;
    totalProducts: number;
    totalViews: number;
    totalRevenue: number;
    avgProductsPerCategory: number;
    conversionRate: number;
  };
  trends: {
    daily: Array<{ date: string; views: number; products: number; revenue: number }>;
    weekly: Array<{ week: string; views: number; products: number; revenue: number }>;
    monthly: Array<{ month: string; views: number; products: number; revenue: number }>;
  };
  topCategories: Array<{
    id: string;
    name: string;
    views: number;
    products: number;
    revenue: number;
    conversionRate: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  levelDistribution: Array<{ level: number; count: number; products: number; revenue: number }>;
  searchAnalytics: {
    topQueries: Array<{ query: string; count: number; avgResults: number }>;
    zeroResultQueries: Array<{ query: string; count: number }>;
    searchVolume: Array<{ date: string; searches: number }>;
  };
  performanceMetrics: {
    avgResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    uptime: number;
  };
}

const CategoryAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<CategoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  [dateRange, setDateRange] = useState<[any, any] | null>(null);

  const API_BASE = process.env.REACT_APP_API_URL ||
    'http://localhost:3001/api';

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedCategory, dateRange]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {
        timeRange,
        includeTrends: 'true',
        includeTopCategories: 'true',
        includeSearchAnalytics: 'true',
        includePerformanceMetrics: 'true'
      };

      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await axios.get(`${API_BASE}/categories/analytics`, { params });
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, timeRange, selectedCategory, dateRange]);

  const exportAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories/analytics/export`, {
        params: {
          timeRange,
          categoryId: selectedCategory,
          format: 'csv'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'category-analytics.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const COLORS = ['#EFB612', '#1890ff', '#52c41a', '#fa8c16', '#f5222d'];

  const categoryColumns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Level {record.level}
          </Text>
        </div>
      )
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      render: (views: number) => (
        <Space>
          <EyeOutlined />
          <Text>{views.toLocaleString()}</Text>
        </Space>
      ),
      sorter: (a: any, b: any) => a.views - b.views
    },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: number) => (
        <Tag color="blue">{products.toLocaleString()}</Tag>
      ),
      sorter: (a: any, b: any) => a.products - b.products
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Space>
          <DollarOutlined />
          <Text>${revenue.toLocaleString()}</Text>
        </Space>
      ),
      sorter: (a: any, b: any) => a.revenue - b.revenue
    },
    {
      title: 'Conversion',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate * 100)}
          size="small"
          status={rate > 0.05 ? 'success' : rate > 0.02 ? 'normal' : 'exception'}
        />
      ),
      sorter: (a: any, b: any) => a.conversionRate - b.conversionRate
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <Tag
          color={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'default'}
          icon={trend === 'up' ? <TrendingUpOutlined /> : trend === 'down' ? <TrendingDownOutlined /> : null}
        >
          {trend}
        </Tag>
      )
    }
  ];

  if (loading && !analytics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Category Analytics</Title>
        <Text type="secondary">Comprehensive insights into category performance and trends</Text>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Select
                value={timeRange}
                onChange={setTimeRange}
                style={{ width: 120 }}
              >
                <Option value="7d">Last 7 days</Option>
                <Option value="30d">Last 30 days</Option>
                <Option value="90d">Last 90 days</Option>
              </Select>
              
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={['Start Date', 'End Date']}
              />
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchAnalytics}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportAnalytics}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {analytics ? (
        <>
          {/* Overview Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Categories"
                  value={analytics.overview.totalCategories}
                  prefix={<UserOutlined />}
                  suffix={
                    <Text type="secondary">
                      ({analytics.overview.activeCategories} active)
                    </Text>
                  }
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Products"
                  value={analytics.overview.totalProducts}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Views"
                  value={analytics.overview.totalViews}
                  prefix={<EyeOutlined />}
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={analytics.overview.totalRevenue}
                  prefix={<DollarOutlined />}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Avg Products/Category"
                  value={analytics.overview.avgProductsPerCategory}
                  precision={1}
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card>
                <Statistic
                  title="Conversion Rate"
                  value={analytics.overview.conversionRate * 100}
                  precision={2}
                  suffix="%"
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card>
                <Statistic
                  title="Cache Hit Rate"
                  value={analytics.performanceMetrics.cacheHitRate * 100}
                  precision={1}
                  suffix="%"
                  valueStyle={{
                    color: analytics.performanceMetrics.cacheHitRate > 0.8 ? '#3f8600' : '#cf1322'
                  }}
                />
              </Card>
            </Col>
            
            <Col span={6}>
              <Card>
                <Statistic
                  title="Avg Response Time"
                  value={analytics.performanceMetrics.avgResponseTime}
                  precision={0}
                  suffix="ms"
                  valueStyle={{
                    color: analytics.performanceMetrics.avgResponseTime < 500 ? '#3f8600' : '#cf1322'
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Trends Chart */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={16}>
              <Card title="Performance Trends">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#EFB612"
                      strokeWidth={2}
                      name="Views"
                    />
                    <Line
                      type="monotone"
                      dataKey="products"
                      stroke="#1890ff"
                      strokeWidth={2}
                      name="Products"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#52c41a"
                      strokeWidth={2}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card title="Level Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.levelDistribution}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ level }) => `Level ${level}`}
                    >
                      {analytics.levelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Top Categories Table */}
          <Card title="Top Performing Categories" style={{ marginBottom: 24 }}>
            <Table
              columns={categoryColumns}
              dataSource={analytics.topCategories}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Search Analytics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card title="Top Search Queries">
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {analytics.searchAnalytics.topQueries.map((query, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Row justify="space-between">
                        <Col>
                          <Text strong>{query.query}</Text>
                        </Col>
                        <Col>
                          <Space>
                            <Tag>{query.count} searches</Tag>
                            <Text type="secondary">{query.avgResults} results</Text>
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="Zero Result Queries">
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {analytics.searchAnalytics.zeroResultQueries.map((query, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <Row justify="space-between">
                        <Col>
                          <Text type="danger">{query.query}</Text>
                        </Col>
                        <Col>
                          <Tag color="red">{query.count} searches</Tag>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        !loading && (
          <Empty
            description="No analytics data available"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )
      )}
    </motion.div>
  );
};

export default CategoryAnalytics;
