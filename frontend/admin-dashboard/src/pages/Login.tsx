import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import './Login.css';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
  mfaCode?: string;
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/admin/auth/login', {
        email: values.email,
        password: values.password,
        mfaCode: values.mfaCode,
      });

      if (response.data.requiresMfa) {
        setRequiresMfa(true);
        message.info('Please enter your MFA code');
        setLoading(false);
        return;
      }

      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" title="Mnbara Admin Dashboard">
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>

          {requiresMfa && (
            <Form.Item
              name="mfaCode"
              rules={[{ required: true, message: 'Please input your MFA code!' }]}
            >
              <Input
                placeholder="MFA Code (6 digits)"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              {requiresMfa ? 'Verify MFA' : 'Log in'}
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <p>Mnbara Platform © 2025</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
