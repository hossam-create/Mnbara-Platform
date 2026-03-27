import React, { useState } from 'react';
import { Card, Button, Space, Tag, Typography, Avatar, Row, Col } from 'antd';
import { UserOutlined, GlobalOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import SubscriptionGate from '../SubscriptionGate/SubscriptionGate';

const { Title, Text, Paragraph } = Typography;

interface Traveler {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  travelDate: string;
  origin: string;
  destination: string;
  availableCapacity: number;
  pricePerKg: number;
}

interface ProductRequestProps {
  traveler: Traveler;
  product: {
    id: string;
    name: string;
    weight: number;
    price: number;
  };
}

const ProductRequest: React.FC<ProductRequestProps> = ({ traveler, product }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const handleRequestAccessGranted = () => {
    setIsRequesting(true);
    
    // Simulate API call to request item
    setTimeout(() => {
      setIsRequesting(false);
      setRequestSuccess(true);
      console.log('Item requested successfully from traveler:', traveler.id);
    }, 2000);
  };

  const handleRequestAccessDenied = (reason: string) => {
    console.log('Access denied:', reason);
  };

  const totalCost = product.weight * traveler.pricePerKg;

  return (
    <Card 
      hoverable 
      style={{ marginBottom: 16, borderRadius: 12 }}
      bodyStyle={{ padding: 20 }}
    >
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={4}>
          <div style={{ textAlign: 'center' }}>
            <Avatar 
              size={64} 
              icon={<UserOutlined />}
              src={traveler.avatar}
              style={{ backgroundColor: '#1890ff' }}
            />
            <Text strong style={{ display: 'block', marginTop: 8 }}>
              {traveler.name}
            </Text>
            <div>
              <Tag color="gold">⭐ {traveler.rating}</Tag>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={14}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <Space>
                <GlobalOutlined style={{ color: '#52c41a' }} />
                <Text strong>{traveler.origin}</Text>
                <span>→</span>
                <Text strong style={{ color: '#1890ff' }}>{traveler.destination}</Text>
              </Space>
            </div>

            <div style={{ marginBottom: 12 }}>
              <CalendarOutlined style={{ color: '#faad14' }} />
              <Text style={{ marginLeft: 8 }}>Traveling on {traveler.travelDate}</Text>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                Available capacity: <Text strong>{traveler.availableCapacity} kg</Text>
              </Text>
            </div>

            <div>
              <Text type="secondary">
                Price: <Text strong style={{ color: '#52c41a' }}>${traveler.pricePerKg}/kg</Text>
              </Text>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">Estimated Cost</Text>
              <br />
              <Text strong style={{ fontSize: 20, color: '#1890ff' }}>
                ${totalCost.toFixed(2)}
              </Text>
            </div>

            <SubscriptionGate
              featureName="request-item-from-traveler"
              buttonText={requestSuccess ? "Request Sent!" : "Request Item"}
              onAccessGranted={handleRequestAccessGranted}
              onAccessDenied={handleRequestAccessDenied}
            />

            {requestSuccess && (
              <div style={{ marginTop: 12 }}>
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Request Confirmed!
                </Tag>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default ProductRequest;