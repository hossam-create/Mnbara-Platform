import React, { useState } from 'react';
import { Layout, Menu, Button, Card, Typography, Row, Col, Space, Tag, Avatar, Badge, Modal, Form, Input, Select, message } from 'antd';
import { 
  ShoppingCartOutlined, 
  GlobalOutlined, 
  UserOutlined, 
  DollarOutlined,
  HistoryOutlined,
  PlusOutlined,
  DashboardOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface OrderRequest {
  itemName: string;
  country: string;
  maxPrice?: number;
  description: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH';
}

const UserDashboard: React.FC = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock user data
  const user = {
    name: 'Ahmed Mohamed',
    email: 'ahmed@example.com',
    avatar: '👤',
    balance: 150.00,
    totalOrders: 12,
    completedOrders: 8
  };

  // Mock recent orders
  const recentOrders = [
    {
      id: '1',
      itemName: 'iPhone 15 Pro Max',
      country: 'USA',
      status: 'PENDING',
      maxPrice: 1200,
      createdAt: '2024-02-15',
      urgency: 'HIGH'
    },
    {
      id: '2', 
      itemName: 'Nike Air Jordan',
      country: 'China',
      status: 'ACCEPTED',
      maxPrice: 200,
      createdAt: '2024-02-14',
      urgency: 'NORMAL'
    },
    {
      id: '3',
      itemName: 'MacBook Air M2',
      country: 'UK', 
      status: 'COMPLETED',
      maxPrice: 1100,
      createdAt: '2024-02-10',
      urgency: 'LOW'
    }
  ];

  const handleRequestItem = () => {
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (values: OrderRequest) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Order request submitted:', values);
      
      message.success('✅ Your request has been submitted!');
      setShowRequestModal(false);
      
      // In real app, refresh orders list
      
    } catch (error) {
      message.error('Failed to submit request');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'ACCEPTED': return 'blue';
      case 'COMPLETED': return 'green';
      default: return 'default';
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
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'My Orders',
      badge: recentOrders.filter(o => o.status === 'PENDING').length
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: 'Order History'
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Layout.Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Mnbara</Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <Text strong>{user.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>{user.email}</Text>
          </div>
          <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
            {user.avatar}
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
                          Welcome back, {user.name}!
                        </Title>
                        <Paragraph>
                          Request items from travelers heading to your country. Save on shipping and get your items faster!
                        </Paragraph>
                      </Col>
                      <Col>
                        <Button
                          type="primary"
                          size="large"
                          icon={<PlusOutlined />}
                          onClick={handleRequestItem}
                          style={{ 
                            backgroundColor: '#52c41a', 
                            borderColor: '#52c41a',
                            height: '50px',
                            fontSize: '16px'
                          }}
                        >
                          Request an Item from a Traveler
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* Stats Cards */}
              <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                        ${user.balance.toFixed(2)}
                      </Title>
                      <Text type="secondary">Account Balance</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
                        {user.totalOrders}
                      </Title>
                      <Text type="secondary">Total Orders</Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={3} style={{ color: '#faad14', margin: 0 }}>
                        {user.completedOrders}
                      </Title>
                      <Text type="secondary">Completed</Text>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Recent Orders */}
              <Row>
                <Col span={24}>
                  <Card title="Recent Orders" extra={<ShoppingCartOutlined />}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {recentOrders.map((order) => (
                        <Card key={order.id} size="small" hoverable>
                          <Row align="middle" gutter={[16, 16]}>
                            <Col flex="auto">
                              <div>
                                <Text strong style={{ fontSize: '16px' }}>{order.itemName}</Text>
                                <br />
                                <Space>
                                  <GlobalOutlined style={{ color: '#1890ff' }} />
                                  <Text>{order.country}</Text>
                                  {order.maxPrice && (
                                    <>
                                      <DollarOutlined style={{ color: '#52c41a' }} />
                                      <Text strong>${order.maxPrice}</Text>
                                    </>
                                  )}
                                </Space>
                                <br />
                                <Space size="small">
                                  <Tag color={getStatusColor(order.status)}>{order.status}</Tag>
                                  <Tag color={getUrgencyColor(order.urgency)}>{order.urgency}</Tag>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {order.createdAt}
                                  </Text>
                                </Space>
                              </div>
                            </Col>
                            <Col>
                              <Button type="link">View Details</Button>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {activeTab === 'orders' && (
            <Card title="My Orders">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleRequestItem}
                style={{ marginBottom: 16 }}
              >
                Request New Item
              </Button>
              <Space direction="vertical" style={{ width: '100%' }}>
                {recentOrders.map((order) => (
                  <Card key={order.id} hoverable>
                    <Row align="middle" gutter={[16, 16]}>
                      <Col flex="auto">
                        <div>
                          <Text strong style={{ fontSize: '18px' }}>{order.itemName}</Text>
                          <br />
                          <Space>
                            <GlobalOutlined style={{ color: '#1890ff' }} />
                            <Text>{order.country}</Text>
                            {order.maxPrice && (
                              <>
                                <DollarOutlined style={{ color: '#52c41a' }} />
                                <Text strong>${order.maxPrice}</Text>
                              </>
                            )}
                          </Space>
                          <br />
                          <Space size="small">
                            <Tag color={getStatusColor(order.status)}>{order.status}</Tag>
                            <Tag color={getUrgencyColor(order.urgency)}>{order.urgency}</Tag>
                            <Text type="secondary">{order.createdAt}</Text>
                          </Space>
                        </div>
                      </Col>
                      <Col>
                        <Button type="primary">Track Order</Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>
          )}
        </Layout.Content>
      </Layout>

      {/* Request Modal */}
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <ShoppingCartOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: 8 }} />
            <Title level={3} style={{ margin: 0, display: 'inline-block' }}>
              Request an Item from a Traveler
            </Title>
          </div>
        }
        open={showRequestModal}
        onCancel={() => setShowRequestModal(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleSubmitRequest}
          initialValues={{ urgency: 'NORMAL' }}
        >
          <Form.Item
            label="What item do you want?"
            name="itemName"
            rules={[{ required: true, message: 'Please enter the item name' }]}
          >
            <Input 
              size="large"
              placeholder="e.g., iPhone 15 Pro Max, Nike Air Jordan, MacBook Air" 
            />
          </Form.Item>

          <Form.Item
            label="Which country?"
            name="country"
            rules={[{ required: true, message: 'Please enter the country' }]}
          >
            <Input 
              size="large"
              placeholder="e.g., USA, UK, China, Japan" 
            />
          </Form.Item>

          <Form.Item
            label="Maximum price you're willing to pay ($)"
            name="maxPrice"
          >
            <Input 
              type="number" 
              size="large"
              placeholder="Optional - leave blank if price doesn't matter" 
            />
          </Form.Item>

          <Form.Item
            label="Tell us more about what you want"
            name="description"
            rules={[{ required: true, message: 'Please describe what you want' }]}
          >
            <TextArea 
              rows={4}
              placeholder="Color, size, model, specifications, etc."
            />
          </Form.Item>

          <Form.Item
            label="How urgent is this?"
            name="urgency"
          >
            <Select size="large">
              <Option value="LOW">🟢 LOW - Flexible timing</Option>
              <Option value="NORMAL">🟡 NORMAL - Within 2 weeks</Option>
              <Option value="HIGH">🔴 HIGH - Within 1 week</Option>
            </Select>
          </Form.Item>

          <div style={{ backgroundColor: '#f6ffed', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <Text strong style={{ color: '#52c41a' }}>
              <DollarOutlined /> Service Fee: $2.99
            </Text>
            <br />
            <Text type="secondary">
              This small fee helps us connect you with reliable travelers
            </Text>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Submit Request - Pay $2.99 Fee
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default UserDashboard;