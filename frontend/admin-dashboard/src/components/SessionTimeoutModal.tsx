import React from 'react';
import { Modal, Button, Progress, Typography, Space, Alert } from 'antd';
import { LogoutOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const SessionTimeoutModal: React.FC = () => {
  const { 
    sessionTimeout, 
    showTimeoutWarning, 
    resetSessionTimer, 
    logout 
  } = useAuth();

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (milliseconds: number): number => {
    const totalMinutes = 30; // 30 minutes total session
    const remainingMinutes = milliseconds / 60000;
    return (remainingMinutes / totalMinutes) * 100;
  };

  if (!showTimeoutWarning) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          Session Timeout Warning
        </Space>
      }
      open={showTimeoutWarning}
      onCancel={() => setShowTimeoutWarning(false)}
      footer={[
        <Button 
          key="logout" 
          icon={<LogoutOutlined />} 
          onClick={logout}
          danger
        >
          Logout Now
        </Button>,
        <Button 
          key="continue" 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={resetSessionTimer}
        >
          Continue Session
        </Button>,
      ]}
      width={500}
      closable={false}
      maskClosable={false}
    >
      <Alert
        type="warning"
        message="Your session is about to expire"
        description="For security reasons, your session will automatically logout due to inactivity."
        style={{ marginBottom: 16 }}
      />
      
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          Time Remaining: {formatTime(sessionTimeout)}
        </Title>
        <Text type="secondary">
          Your session will expire in {formatTime(sessionTimeout)}
        </Text>
      </div>

      <Progress
        percent={progressPercentage(sessionTimeout)}
        status="active"
        strokeColor={
          sessionTimeout <= 60000 ? '#ff4d4f' : 
          sessionTimeout <= 300000 ? '#faad14' : '#52c41a'
        }
        format={() => formatTime(sessionTimeout)}
      />

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Click "Continue Session" to extend your session or you will be automatically logged out.
        </Text>
      </div>
    </Modal>
  );
};

export default SessionTimeoutModal;