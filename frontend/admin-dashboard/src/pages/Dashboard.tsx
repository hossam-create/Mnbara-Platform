import React from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { 
  UserOutlined, 
  ShoppingOutlined, 
  DollarOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  // Mock data for dashboard
  const stats = {
    totalUsers: 1247,
    activeOrders: 89,
    revenue: 125430,
    conversionRate: '4.2%'
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Dashboard Overview
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Orders"
              value={stats.activeOrders}
              prefix={<ShoppingOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Revenue"
              value={stats.revenue}
              prefix="$"
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={stats.conversionRate}
              prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" style={{ height: '300px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <p>🚀 Manage user accounts and permissions</p>
              <p>📊 View analytics and reports</p>
              <p>⚙️ Configure system settings</p>
              <p>🔧 Access engineering tools</p>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" style={{ height: '300px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <p>📝 New user registration - 5 min ago</p>
              <p>✅ Order completed - 12 min ago</p>
              <p>⚠️ System warning - 25 min ago</p>
              <p>🔄 Database backup - 1 hour ago</p>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;