import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Button, Space, Tag, Alert } from 'antd';
import { GlobalOutlined, UserOutlined, CalendarOutlined, DollarOutlined, CrownOutlined } from '@ant-design/icons';
import ProductRequest from '../components/ProductRequest/ProductRequest';
import SubscriptionGate from '../components/SubscriptionGate/SubscriptionGate';

const { Title, Text, Paragraph } = Typography;
const { Header, Content } = Layout;

// Mock data for demonstration
const mockTravelers: any[] = [
  {
    id: '1',
    name: 'Ahmed Al-Rashid',
    rating: 4.8,
    travelDate: '2024-02-20',
    origin: 'Riyadh, Saudi Arabia',
    destination: 'Dubai, UAE',
    availableCapacity: 5,
    pricePerKg: 15
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    rating: 4.9,
    travelDate: '2024-02-22',
    origin: 'London, UK',
    destination: 'Jeddah, Saudi Arabia',
    availableCapacity: 8,
    pricePerKg: 20
  },
  {
    id: '3',
    name: 'Mohammed Saleh',
    rating: 4.7,
    travelDate: '2024-02-25',
    origin: 'Cairo, Egypt',
    destination: 'Dammam, Saudi Arabia',
    availableCapacity: 3,
    pricePerKg: 12
  }
];

const mockProduct = {
  id: 'prod-123',
  name: 'iPhone 15 Pro Max',
  weight: 0.5,
  price: 1200
};

const SubscriptionDemo: React.FC = () => {
  const [userPlan, setUserPlan] = useState<string>('free'); // free, basic, premium
  const [showSubscriptionGate, setShowSubscriptionGate] = useState(false);

  const handleRequestAccessGranted = () => {
    console.log('Access granted - proceed with requesting item');
    // Here you would implement the actual request logic
  };

  const handleRequestAccessDenied = (reason: string) => {
    console.log('Access denied:', reason);
    setShowSubscriptionGate(true);
  };

  const upgradeToPremium = () => {
    setUserPlan('premium');
    setShowSubscriptionGate(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              Mnbara Travel Marketplace
            </Title>
          </div>
          <div>
            <Tag color={userPlan === 'premium' ? 'gold' : userPlan === 'basic' ? 'blue' : 'default'}>
              <CrownOutlined /> {userPlan.toUpperCase()} Plan
            </Tag>
          </div>
        </div>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card>
                <Title level={2}>
                  <GlobalOutlined /> Request Items from Travelers
                </Title>
                <Paragraph>
                  Find travelers heading to your destination and request them to bring items for you. 
                  Save on shipping costs and get your items faster!
                </Paragraph>

                <Alert
                  message="Subscription Required"
                  description="Requesting items from travelers requires a Premium subscription ($9.99/month). Upgrade now to access this feature and many more!"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Available Travelers" extra={<UserOutlined />}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {mockTravelers.map((traveler) => (
                    <ProductRequest
                      key={traveler.id}
                      traveler={traveler}
                      product={mockProduct}
                    />
                  ))}
                </Space>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="Subscription Benefits" extra={<CrownOutlined />}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Title level={4} style={{ color: '#52c41a' }}>Free Plan</Title>
                      <Text>$0/month</Text>
                      <ul style={{ textAlign: 'left', marginTop: 16 }}>
                        <li>✅ Browse products</li>
                        <li>✅ Basic search</li>
                        <li>✅ View traveler profiles</li>
                        <li>❌ Request items</li>
                      </ul>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Title level={4} style={{ color: '#1890ff' }}>Basic Plan</Title>
                      <Text>$4.99/month</Text>
                      <ul style={{ textAlign: 'left', marginTop: 16 }}>
                        <li>✅ All Free features</li>
                        <li>✅ Send messages to travelers</li>
                        <li>✅ Advanced search filters</li>
                        <li>❌ Request items</li>
                      </ul>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" style={{ textAlign: 'center', border: '2px solid #faad14' }}>
                      <Title level={4} style={{ color: '#faad14' }}>
                        <CrownOutlined /> Premium Plan
                      </Title>
                      <Text>$9.99/month</Text>
                      <ul style={{ textAlign: 'left', marginTop: 16 }}>
                        <li>✅ All Basic features</li>
                        <li>✅ <strong>Request items from travelers</strong></li>
                        <li>✅ Priority customer support</li>
                        <li>✅ Advanced analytics</li>
                      </ul>
                      <Button 
                        type="primary" 
                        icon={<CrownOutlined />}
                        onClick={upgradeToPremium}
                        style={{ marginTop: 16, backgroundColor: '#faad14', borderColor: '#faad14' }}
                      >
                        Upgrade to Premium
                      </Button>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default SubscriptionDemo;