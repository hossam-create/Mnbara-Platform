import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, ShieldOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
  mfaCode?: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresMFA, setRequiresMFA] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      const success = await auth.login(values.email, values.password, values.mfaCode);
      
      if (success) {
        navigate('/cockpit');
      } else {
        setError('Invalid credentials or insufficient clearance level');
      }
    } catch (err: any) {
      if (err.message?.includes('MFA_REQUIRED')) {
        setRequiresMFA(true);
        setError('Multi-Factor Authentication required');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Effects */}
      <div className="login-background">
        <div className="grid-overlay"></div>
        <div className="security-indicators">
          <div className="security-dot"></div>
          <div className="security-dot"></div>
          <div className="security-dot"></div>
        </div>
      </div>

      {/* Login Card */}
      <Card className="login-card glass-panel">
        <div className="login-header">
          <div className="system-logo">
            <ShieldOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </div>
          <Title level={2} style={{ color: '#fff', textAlign: 'center', margin: '16px 0 8px 0' }}>
            System Control Access
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'center' }}>
            Mnbara Platform - Secure Authentication Required
          </Text>
        </div>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />

        {/* Security Warning */}
        <Alert
          message="RESTRICTED SYSTEM"
          description="This system is for authorized personnel only. All access attempts are logged and monitored."
          type="warning"
          icon={<SafetyOutlined />}
          style={{ 
            marginBottom: '24px',
            background: 'rgba(250, 140, 22, 0.1)',
            border: '1px solid rgba(250, 140, 22, 0.3)'
          }}
        />

        {/* Error Alert */}
        {error && (
          <Alert
            message="Authentication Failed"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ 
              marginBottom: '16px',
              background: 'rgba(245, 34, 45, 0.1)',
              border: '1px solid rgba(245, 34, 45, 0.3)'
            }}
          />
        )}

        {/* Login Form */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label={<span style={{ color: '#fff' }}>Email Address</span>}
            rules={[
              { required: true, message: 'Please enter your email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your email"
              autoComplete="email"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#fff' }}>Password</span>}
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            />
          </Form.Item>

          {/* MFA Code Field (shown when required) */}
          {requiresMFA && (
            <Form.Item
              name="mfaCode"
              label={<span style={{ color: '#fff' }}>MFA Code</span>}
              rules={[
                { required: true, message: 'Please enter your MFA code' },
                { len: 6, message: 'MFA code must be 6 digits' }
              ]}
            >
              <Input
                prefix={<SafetyOutlined />}
                placeholder="Enter 6-digit MFA code"
                maxLength={6}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff',
                  textAlign: 'center',
                  fontSize: '18px',
                  letterSpacing: '4px'
                }}
              />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Authenticating...' : 'Access System Control'}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '24px 0 16px 0' }} />

        {/* Security Information */}
        <div className="security-info">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              🔒 All communications are encrypted with TLS 1.3
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              🛡️ Multi-factor authentication required for L3+ access
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              📊 Session monitoring and audit logging active
            </Text>
          </Space>
        </div>

        {/* Emergency Contact */}
        <div className="emergency-contact">
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textAlign: 'center', display: 'block' }}>
            Emergency Access: Contact System Administrator
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textAlign: 'center', display: 'block' }}>
            Security Hotline: +1-XXX-XXX-XXXX
          </Text>
        </div>
      </Card>

      {/* System Status Indicator */}
      <div className="system-status">
        <div className="status-indicator online"></div>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
          System Status: OPERATIONAL
        </Text>
      </div>
    </div>
  );
};

export default Login;