/**
 * Analytics Page - Business Intelligence Dashboard
 * Requirements: Display key metrics, charts, and business insights
 */

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Space } from 'antd';
import {
  BarChartOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';

const Analytics: React.FC = () => {
  // Mock analytics data
  const businessMetrics = {
    totalRevenue: '$245,890',
    activeUsers: '12,456',
    transactions: '8,923',
    conversionRate: '4.2%',
    averageOrderValue: '$89.50',
    customerSatisfaction: '94%'
  };

  const growthMetrics = {
    revenueGrowth: '+12.5%',
    userGrowth: '+8.3%',
    transactionGrowth: '+15.2%',
    retentionRate: '87%'
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>
        <BarChartOutlined /> Business Analytics
      </h1>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={businessMetrics.totalRevenue}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Space>
              <RiseOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', fontSize: '12px' }}>
                {growthMetrics.revenueGrowth}
              </span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={businessMetrics.activeUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Space>
              <RiseOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', fontSize: '12px' }}>
                {growthMetrics.userGrowth}
              </span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Transactions"
              value={businessMetrics.transactions}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Space>
              <RiseOutlined style={{ color: '#52c41a' }} />
              <span style={{ color: '#52c41a', fontSize: '12px' }}>
                {growthMetrics.transactionGrowth}
              </span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={businessMetrics.conversionRate}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
            <Progress
              percent={4.2}
              size="small"
              showInfo={false}
              strokeColor="#fa8c16"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Placeholder */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title="Revenue Trend" style={{ height: '300px' }}>
            <div style={{ 
              height: '200px', 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              📈 Revenue Chart
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="User Acquisition" style={{ height: '300px' }}>
            <div style={{ 
              height: '200px', 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              👥 User Growth Chart
            </div>
          </Card>
        </Col>
      </Row>

      {/* Additional Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Avg Order Value"
              value={businessMetrics.averageOrderValue}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Customer Satisfaction"
              value={businessMetrics.customerSatisfaction}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Retention Rate"
              value={growthMetrics.retentionRate}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;