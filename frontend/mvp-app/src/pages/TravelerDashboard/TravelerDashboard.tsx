import React, { useState } from 'react';
import { Layout, Card, Typography, Row, Col, Button, Space, Tag, Avatar, Badge, Modal, message } from 'antd';
import { 
  UserOutlined, 
  GlobalOutlined, 
  DollarOutlined, 
  CheckCircleOutlined, 
  CalendarOutlined,
  HistoryOutlined,
  DashboardOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface Order {
  id: string;
  itemName: string;
  country: string;
  maxPrice?: number;
  description: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH';
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED';
  user: {
    name: string;
    avatar: string;
    rating: number;
  };
  createdAt: string;
  serviceFee: number;
}

const TravelerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock traveler data
  const traveler = {
    name: 'Mohamed Ahmed',
    email: 'mohamed@example.com',
    avatar: '✈️',
    rating: 4.8,
    totalTrips: 15,
    completedOrders: 12,
    earnings: 450.50
  };

  // Mock available orders
  const availableOrders: Order[] = [
    {
      id: '1',
      itemName: 'iPhone 15 Pro Max',
      country: 'USA',
      maxPrice: 1200,
      description: 'Latest iPhone model, unlocked, 256GB, Space Gray',
      urgency: 'HIGH',
      status: 'PENDING',
      user: {
        name: 'Ahmed Hassan',
        avatar: '👤',
        rating: 4.9
      },
      createdAt: '2 hours ago',
      serviceFee: 2.99
    },
    {
      id: '2',
      itemName: 'MacBook Air M2',
      country: 'UK',
      maxPrice: 1100,
      description: 'M2 chip, 256GB SSD, 8GB RAM, Space Gray',
      urgency: 'NORMAL',
      status: 'PENDING',
      user: {
        name: 'Sarah Johnson',
        avatar: '👩',
        rating: 4.7
      },
      createdAt: '5 hours ago',
      serviceFee: 2.99
    },
    {
      id: '3',
      itemName: 'Nike Air Jordan 1',
      country: 'China',
      maxPrice: 200,
      description: 'Size 42, Black/Red colorway, OG box included',
      urgency: 'LOW',
      status: 'PENDING',
      user: {
        name: 'Khalid Ali',
        avatar: '👨',
        rating: 4.5
      },
      createdAt: '1 day ago',
      serviceFee: 2.99
    }
  ];

  // Mock accepted orders
  const acceptedOrders: Order[] = [
    {
      id: '4',
      itemName: 'iPad Pro 12.9',
      country: 'Japan',
      maxPrice: 800,
      description: 'M2 chip, 128GB, WiFi only, Silver',
      urgency: 'NORMAL',
      status: 'ACCEPTED',
      user: {
        name: 'Fatima Al-Zahra',
        avatar: '👩‍💼',
        rating: 4.8
      },
      createdAt: '3 days ago',
      serviceFee: 2.99
    }
  ];

  const handleAcceptOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowAcceptModal(true);
  };

  const confirmAcceptOrder = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`✅ Order accepted! Contact ${selectedOrder?.user.name} to arrange pickup.`);
      setShowAcceptModal(false);
      setSelectedOrder(null);
      
      // In real app, refresh orders list
      
    } catch (error) {
      message.error('Failed to accept order');
      console.error('Accept order error:', error);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH': return 'red';
      case 'NORMAL': return 'orange';
      case 'LOW': return 'green';
      default: return 'default';
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: 'available',
      icon: <GlobalOutlined />,
      label: 'Available Orders',
      badge: availableOrders.length
    },
    {
      key: 'accepted',
      icon: <CheckCircleOutlined />,
      label: 'My Orders',
      badge: acceptedOrders.length
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'History'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Layout.Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Mnbara Traveler</Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <Text strong>{traveler.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{traveler.email}</Text>
          </div>
          <Avatar size="large" style={{ backgroundColor: '#52c41a' }}>
            {traveler.avatar}
          </Avatar>
        </div>
      </Layout.Header>

      <Layout>
        {/* Sidebar */}
        <Layout.Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={({ key }) => setActiveTab(key)}
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.badge ? (
                <Badge count={item.badge} size="small">
                  <span>{item.label}</span>
                </Badge>
              ) : item.label
            }))}
          />
        </Layout.Sider>

        {/* Main Content */}
        <Layout.Content style={{ padding: '24px' }}>
          {activeTab === 'dashboard' && (
            <div>
              {/* Welcome Section */}
              <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <Card>
                    <Row align="middle">
                      <Col flex="auto">
                        <Title level={2} style={{ marginBottom: 8 }}>
                          Welcome back, {traveler.name}! ✈️
                        </Title>
                        <Paragraph>
                          See orders from people who want items from countries you're traveling to.
                          Accept orders, earn money, and help people get what they need!
                        </Paragraph>
                      </Col>
                      <Col>
                        <Button
                          type="primary"
                          size="large"
                          icon={<GlobalOutlined />}
                          onClick={() => setActiveTab('available')}
                          style={{ backgroundColor: '#1890ff' }}
                        >
                          Browse Available Orders
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* Stats Cards */}
              <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={6}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                        {traveler.totalTrips}
                      </Title>
                      <Text type="secondary">Total Trips</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
                        {traveler.completedOrders}
                      </Title>
                      <Text type="secondary">Orders Completed</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3} style={{ color: '#faad14', margin: 0 }}>
                        ${traveler.earnings.toFixed(2)}
                      </Title>
                      <Text type="secondary">Total Earnings</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={6}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3} style={{ color: '#722ed1', margin: 0 }}>
                        ⭐ {traveler.rating}
                      </Title>
                      <Text type="secondary">Rating</Text>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Quick Actions */}
              <Row>
                <Col span={24}>
                  <Card title="Quick Actions">
                    <Row gutter={[16, 16]}>
                      <Col>
                        <Button
                          type="primary"
                          size="large"
                          icon={<GlobalOutlined />}
                          onClick={() => setActiveTab('available')}
                        >
                          View Available Orders ({availableOrders.length})
                        </Button>
                      </Col>
                      <Col>
                        <Button
                          size="large"
                          icon={<CheckCircleOutlined />}
                          onClick={() => setActiveTab('accepted')}
                        >
                          My Accepted Orders ({acceptedOrders.length})
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {activeTab === 'available' && (
            <Card title="Available Orders" extra={<GlobalOutlined />}>
              <Paragraph>
                Orders from people who want items from countries you're traveling to.
                Accept orders and earn money!
              </Paragraph>
              
              <Space direction="vertical" style={{ width: '100%' }}>
                {availableOrders.map((order) => (
                  <Card key={order.id} hoverable>
                    <Row align="middle" gutter={[16, 16]}>
                      <Col flex="auto">
                        <div>
                          <Title level={4} style={{ marginBottom: 8 }}>
                            {order.itemName}
                          </Title>
                          <Space>
                            <GlobalOutlined style={{ color: '#1890ff' }} />
                            <Text strong>{order.country}</Text>
                            {order.maxPrice && (
                              <>
                                <DollarOutlined style={{ color: '#52c41a' }} />
                                <Text strong>${order.maxPrice}</Text>
                              </>
                            )}
                            <Tag color={getUrgencyColor(order.urgency)}>{order.urgency}</Tag>
                          </Space>
                          <br />
                          <Text type="secondary">{order.description}</Text>
                          <br />
                          <Space size="small" style={{ marginTop: 8 }}>
                            <Avatar size="small" src={order.user.avatar} />
                            <Text>{order.user.name}</Text>
                            <Text>⭐ {order.user.rating}</Text>
                            <Text type="secondary">{order.createdAt}</Text>
                          </Space>
                        </div>
                      </Col>
                      <Col>
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary">Service Fee</Text>
                          <br />
                          <Text strong style={{ color: '#52c41a' }}>
                            ${order.serviceFee}
                          </Text>
                          <br />
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleAcceptOrder(order)}
                            style={{ marginTop: 8 }}
                          >
                            Accept Order
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          )}

          {activeTab === 'accepted' && (
            <Card title="My Accepted Orders" extra={<CheckCircleOutlined />}>
              <Paragraph>
                Orders you have accepted. Contact buyers to arrange pickup and delivery.
              </Paragraph>
              
              <Space direction="vertical" style={{ width: '100%' }}>
                {acceptedOrders.map((order) => (
                  <Card key={order.id}>
                    <Row align="middle" gutter={[16, 16]}>
                      <Col flex="auto">
                        <div>
                          <Title level={4} style={{ marginBottom: 8 }}>
                            {order.itemName}
                          </Title>
                          <Space>
                            <GlobalOutlined style={{ color: '#1890ff' }} />
                            <Text strong>{order.country}</Text>
                            {order.maxPrice && (
                              <>
                                <DollarOutlined style={{ color: '#52c41a' }} />
                                <Text strong>${order.maxPrice}</Text>
                              </>
                            )}
                            <Tag color="blue">ACCEPTED</Tag>
                          </Space>
                          <br />
                          <Text type="secondary">{order.description}</Text>
                          <br />
                          <Space size="small" style={{ marginTop: 8 }}>
                            <Avatar size="small" src={order.user.avatar} />
                            <Text>{order.user.name}</Text>
                            <Text>⭐ {order.user.rating}</Text>
                            <Text type="secondary">{order.createdAt}</Text>
                          </Space>
                        </div>
                      </Col>
                      <Col>
                        <Space direction="vertical">
                          <Button type="primary" icon={<UserOutlined />}>
                            Contact Buyer
                          </Button>
                          <Button type="default" icon={<CalendarOutlined />}>
                            Update Status
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          )}
        </Layout.Content>
      </Layout>

      {/* Accept Order Modal */}
      <Modal
        title="Accept Order"
        open={showAcceptModal}
        onCancel={() => setShowAcceptModal(false)}
        onOk={confirmAcceptOrder}
        okText="Accept Order"
        cancelText="Cancel"
      >
        {selectedOrder && (
          <div>
            <Paragraph>
              You are about to accept this order:
            </Paragraph>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={4}>{selectedOrder.itemName}</Title>
              <Text type="secondary">{selectedOrder.description}</Text>
              <br />
              <Space style={{ marginTop: 8 }}>
                <Text strong>From: {selectedOrder.country}</Text>
                {selectedOrder.maxPrice && (
                  <Text strong>Max Price: ${selectedOrder.maxPrice}</Text>
                )}
                <Tag color={getUrgencyColor(selectedOrder.urgency)}>
                  {selectedOrder.urgency}
                </Tag>
              </Space>
            </Card>
            <Paragraph>
              <Text strong>Next Steps:</Text>
            </Paragraph>
            <ul>
              <li>Contact {selectedOrder.user.name} to arrange pickup</li>
              <li>Buy the item in {selectedOrder.country}</li>
              <li>Deliver to buyer and get paid</li>
              <li>Keep the service fee as your earnings</li>
            </ul>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default TravelerDashboard;