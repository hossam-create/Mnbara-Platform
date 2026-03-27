import React, { useState } from 'react';
import { Layout, Button, Card, Typography, Row, Col, Space, Tag, Input, Form, Modal, message } from 'antd';
import { GlobalOutlined, ShoppingCartOutlined, RocketOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface OrderForm {
  itemName: string;
  country: string;
  maxPrice?: number;
  description: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH';
}

const HomePage: React.FC = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<OrderForm>();

  const handleRequestItem = () => {
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (values: OrderForm) => {
    setLoading(true);
    
    try {
      // Mock API call - in real implementation, this would call your order service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Order submitted:', values);
      
      message.success('✅ Request submitted successfully! Travelers will see your order.');
      setShowRequestModal(false);
      form.resetFields();
      
    } catch (error) {
      message.error('Failed to submit request');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Hero Section */}
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'white' }}>
        <Title level={1} style={{ color: 'white', marginBottom: 16, fontSize: '48px' }}>
          <GlobalOutlined /> Mnbara
        </Title>
        <Title level={3} style={{ color: 'white', marginBottom: 24, fontWeight: 'normal' }}>
          Get Anything from Anywhere
        </Title>
        <Paragraph style={{ color: 'white', fontSize: '18px', marginBottom: 40, maxWidth: '600px', margin: '0 auto 40px' }}>
          Request items from travelers heading to your country. 
          Save money on shipping and get your items faster!
        </Paragraph>
        
        {/* Main CTA Button */}
        <Button
          type="primary"
          size="large"
          icon={<ShoppingCartOutlined />}
          onClick={handleRequestItem}
          style={{ 
            height: '60px', 
            fontSize: '20px', 
            padding: '0 40px',
            backgroundColor: '#52c41a',
            borderColor: '#52c41a',
            borderRadius: '30px'
          }}
        >
          Request an Item from a Traveler
        </Button>
      </div>

      {/* Features Section */}
      <div style={{ padding: '60px 20px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
            How It Works
          </Title>
          
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} md={8}>
              <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
                <ShoppingCartOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>1. Request Item</Title>
                <Text>Tell us what you want and from which country</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
                <RocketOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
                <Title level={4}>2. Traveler Accepts</Title>
                <Text>A traveler heading your way accepts your request</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
                <DollarOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: 16 }} />
                <Title level={4}>3. Pay & Receive</Title>
                <Text>Pay a small service fee and receive your item</Text>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Request Modal */}
      <Modal
        title={<Title level={3}><ShoppingCartOutlined /> Request an Item</Title>}
        open={showRequestModal}
        onCancel={() => setShowRequestModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
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
              placeholder="e.g., iPhone 15 Pro Max, Nike Air Jordan, MacBook Air" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Which country?"
            name="country"
            rules={[{ required: true, message: 'Please enter the country' }]}
          >
            <Input 
              placeholder="e.g., USA, UK, China, Japan" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Maximum price you're willing to pay ($)"
            name="maxPrice"
          >
            <Input 
              type="number" 
              placeholder="Optional - leave blank if price doesn't matter" 
              size="large"
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
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="How urgent is this?"
            name="urgency"
          >
            <div>
              <Tag color="green">LOW - Flexible timing</Tag>
              <Tag color="orange">NORMAL - Within 2 weeks</Tag> 
              <Tag color="red">HIGH - Within 1 week</Tag>
            </div>
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

export default HomePage;