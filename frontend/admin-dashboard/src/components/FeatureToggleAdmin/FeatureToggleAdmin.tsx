import React, { useState, useEffect } from 'react';
import { Card, Table, Switch, Tag, Space, Button, message, Typography, Modal } from 'antd';
import { LockOutlined, UnlockOutlined, CrownOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Feature {
  featureName: string;
  isLocked: boolean;
  requiredPlan: string;
  description: string;
  price?: number;
  usageCount?: number;
}

const FeatureToggleAdmin: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data - in real implementation, this would come from API
  const mockFeatures: Feature[] = [
    {
      featureName: 'request-item-from-traveler',
      isLocked: true,
      requiredPlan: 'premium',
      description: 'Request items from travelers',
      price: 9.99,
      usageCount: 156
    },
    {
      featureName: 'send-messages',
      isLocked: true,
      requiredPlan: 'basic',
      description: 'Send messages to travelers',
      price: 4.99,
      usageCount: 892
    },
    {
      featureName: 'create-product',
      isLocked: false,
      requiredPlan: 'free',
      description: 'Create product listings',
      usageCount: 2341
    },
    {
      featureName: 'priority-support',
      isLocked: true,
      requiredPlan: 'premium',
      description: 'Priority customer support',
      price: 0,
      usageCount: 45
    },
    {
      featureName: 'advanced-analytics',
      isLocked: true,
      requiredPlan: 'premium',
      description: 'Advanced analytics dashboard',
      price: 0,
      usageCount: 78
    }
  ];

  useEffect(() => {
    // Load features from API
    setFeatures(mockFeatures);
  }, []);

  const handleFeatureToggle = async (featureName: string, newLockedStatus: boolean) => {
    setLoading(true);
    
    try {
      // In real implementation, this would call the API
      // await subscriptionAPI.toggleFeatureLock(featureName, newLockedStatus);
      
      // Update local state
      setFeatures(prev => prev.map(feature => 
        feature.featureName === featureName 
          ? { ...feature, isLocked: newLockedStatus }
          : feature
      ));

      message.success(
        `Feature "${featureName}" has been ${newLockedStatus ? 'locked' : 'unlocked'} successfully`
      );
    } catch (error) {
      message.error('Failed to toggle feature lock');
      console.error('Error toggling feature:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'premium': return 'gold';
      case 'basic': return 'blue';
      case 'free': return 'green';
      default: return 'default';
    }
  };

  const getLockColor = (isLocked: boolean) => {
    return isLocked ? '#ff4d4f' : '#52c41a';
  };

  const columns = [
    {
      title: 'Feature',
      dataIndex: 'featureName',
      key: 'featureName',
      render: (text: string, record: Feature) => (
        <div>
          <Text strong style={{ fontSize: '16px' }}>{text}</Text>
          <br />
          <Text type="secondary">{record.description}</Text>
        </div>
      )
    },
    {
      title: 'Required Plan',
      dataIndex: 'requiredPlan',
      key: 'requiredPlan',
      render: (plan: string) => (
        <Tag color={getPlanColor(plan)} icon={<CrownOutlined />}>
          {plan.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        price > 0 ? (
          <Tag color="green" icon={<DollarOutlined />}>
            ${price}/month
          </Tag>
        ) : (
          <Tag color="default">Included</Tag>
        )
      )
    },
    {
      title: 'Usage',
      dataIndex: 'usageCount',
      key: 'usageCount',
      render: (count: number) => (
        <Text>{count?.toLocaleString() || 0}</Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isLocked',
      key: 'isLocked',
      render: (isLocked: boolean, record: Feature) => (
        <Space>
          <Tag color={isLocked ? 'red' : 'green'}>
            {isLocked ? 'Locked' : 'Unlocked'}
          </Tag>
          <Switch
            checked={isLocked}
            onChange={(checked) => handleFeatureToggle(record.featureName, checked)}
            loading={loading}
            checkedChildren={<LockOutlined />}
            unCheckedChildren={<UnlockOutlined />}
            style={{ backgroundColor: getLockColor(isLocked) }}
          />
        </Space>
      )
    }
  ];

  const handleBulkAction = (action: 'lock-all' | 'unlock-all') => {
    Modal.confirm({
      title: 'Confirm Bulk Action',
      content: `Are you sure you want to ${action === 'lock-all' ? 'lock' : 'unlock'} all premium features?`,
      onOk: async () => {
        setLoading(true);
        try {
          // In real implementation, this would call the API
          setFeatures(prev => prev.map(feature => {
            if (feature.requiredPlan === 'premium') {
              return { ...feature, isLocked: action === 'lock-all' };
            }
            return feature;
          }));
          
          message.success(`All premium features have been ${action === 'lock-all' ? 'locked' : 'unlocked'}`);
        } catch (error) {
          message.error('Failed to perform bulk action');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <CrownOutlined /> Feature Access Control
          </Title>
          <Text type="secondary">
            Manage subscription-based feature access for your platform
          </Text>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Space>
            <Button 
              type="primary" 
              danger
              icon={<LockOutlined />}
              onClick={() => handleBulkAction('lock-all')}
              loading={loading}
            >
              Lock All Premium
            </Button>
            <Button 
              type="primary"
              icon={<UnlockOutlined />}
              onClick={() => handleBulkAction('unlock-all')}
              loading={loading}
            >
              Unlock All Premium
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={features}
          rowKey="featureName"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} features`
          }}
          scroll={{ x: 'max-content' }}
        />

        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f5ff', borderRadius: 8 }}>
          <Text strong>💡 Quick Tips:</Text>
          <ul style={{ marginTop: 8 }}>
            <li>Locked features require subscription to access</li>
            <li>Free features are available to all users</li>
            <li>Basic features require Basic plan ($4.99/month)</li>
            <li>Premium features require Premium plan ($9.99/month)</li>
            <li>Use the switches to enable/disable features instantly</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default FeatureToggleAdmin;