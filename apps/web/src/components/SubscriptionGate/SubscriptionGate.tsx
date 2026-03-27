import React, { useState, useEffect } from 'react';
import { Button, Modal, Card, Tag, Space, Alert, Typography } from 'antd';
import { LockOutlined, CheckCircleOutlined, CreditCardOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface SubscriptionGateProps {
  featureName: string;
  buttonText?: string;
  onAccessGranted?: () => void;
  onAccessDenied?: (reason: string) => void;
  className?: string;
}

interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: string;
  currentPlan?: string;
  upgradeUrl?: string;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  featureName,
  buttonText = "Request Item",
  onAccessGranted,
  onAccessDenied,
  className
}) => {
  const [access, setAccess] = useState<FeatureAccess | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Mock API call to check feature access
  const checkFeatureAccess = async (): Promise<FeatureAccess> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response - in real implementation, this would call your subscription service
    const mockResponse: FeatureAccess = {
      hasAccess: false, // Change this to test different scenarios
      reason: 'Plan upgrade required',
      requiredPlan: 'premium',
      currentPlan: 'free',
      upgradeUrl: '/upgrade'
    };

    return mockResponse;
  };

  const handleFeatureClick = async () => {
    setLoading(true);
    
    try {
      const accessCheck = await checkFeatureAccess();
      setAccess(accessCheck);
      
      if (accessCheck.hasAccess) {
        // User has access - proceed with feature
        onAccessGranted?.();
      } else {
        // User doesn't have access - show upgrade prompt
        onAccessDenied?.(accessCheck.reason || 'Access denied');
        setShowUpgradeModal(true);
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setAccess({
        hasAccess: false,
        reason: 'Failed to check access'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    // In real implementation, this would redirect to payment page
    console.log('Redirecting to upgrade page...');
    window.location.href = access?.upgradeUrl || '/upgrade';
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium': return 'gold';
      case 'basic': return 'blue';
      case 'free': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className={className}>
      <Button
        type="primary"
        size="large"
        icon={access?.hasAccess ? <CheckCircleOutlined /> : <LockOutlined />}
        loading={loading}
        onClick={handleFeatureClick}
        style={{ 
          backgroundColor: access?.hasAccess ? '#52c41a' : '#1890ff',
          borderColor: access?.hasAccess ? '#52c41a' : '#1890ff'
        }}
      >
        {buttonText}
      </Button>

      <Modal
        title="Upgrade Required"
        open={showUpgradeModal}
        onCancel={() => setShowUpgradeModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowUpgradeModal(false)}>
            Maybe Later
          </Button>,
          <Button 
            key="upgrade" 
            type="primary" 
            icon={<CreditCardOutlined />}
            onClick={handleUpgrade}
            style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
          >
            Upgrade to {access?.requiredPlan}
          </Button>
        ]}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <LockOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '20px' }} />
          
          <Title level={3} style={{ color: '#faad14' }}>
            Feature Locked
          </Title>
          
          <Text style={{ fontSize: '16px', marginBottom: '20px', display: 'block' }}>
            {access?.reason || 'This feature requires a subscription'}
          </Text>

          <Card style={{ marginBottom: '20px', backgroundColor: '#fff7e6' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Your Current Plan: </Text>
                <Tag color={getPlanColor(access?.currentPlan || '')}>
                  {access?.currentPlan?.toUpperCase() || 'NONE'}
                </Tag>
              </div>
              
              <div>
                <Text strong>Required Plan: </Text>
                <Tag color={getPlanColor(access?.requiredPlan || '')}>
                  {access?.requiredPlan?.toUpperCase() || 'UNKNOWN'}
                </Tag>
              </div>
            </Space>
          </Card>

          <Alert
            message="Upgrade Benefits"
            description="Get instant access to this feature and many more with our premium subscription."
            type="warning"
            showIcon
            style={{ marginBottom: '20px' }}
          />

          <div style={{ backgroundColor: '#f6ffed', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <Text strong style={{ color: '#52c41a' }}>
              Premium Plan Benefits:
            </Text>
            <ul style={{ textAlign: 'left', marginTop: '10px' }}>
              <li>✅ Request items from travelers</li>
              <li>✅ Priority customer support</li>
              <li>✅ Advanced search filters</li>
              <li>✅ Unlimited messaging</li>
              <li>✅ Analytics dashboard</li>
            </ul>
          </div>

          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
            Only $9.99/month
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionGate;