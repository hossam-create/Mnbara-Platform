import React, { useState } from 'react';
import {
  Card,
  Form,
  Button,
  Input,
  Radio,
  Space,
  Alert,
  Spin,
  Modal,
  message,
  Divider,
} from 'antd';
import { QrcodeOutlined, PhoneOutlined, CopyOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

type TwoFactorMethod = 'sms' | 'totp';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onSuccess }) => {
  const [method, setMethod] = useState<TwoFactorMethod>('sms');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'method' | 'setup' | 'verify' | 'backup'>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [form] = Form.useForm();

  /**
   * Handle SMS 2FA setup
   * Requirements: SEC-002, SEC-004
   */
  const handleSMSSetup = async () => {
    try {
      setLoading(true);

      const response = await api.post('/security/2fa/sms/enable', {
        phoneNumber,
      });

      if (response.data) {
        message.success('Verification code sent to your phone');
        setStep('verify');
      }
    } catch (error) {
      message.error('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle TOTP 2FA setup
   * Requirements: SEC-003, SEC-004
   */
  const handleTOTPSetup = async () => {
    try {
      setLoading(true);

      const response = await api.post('/security/2fa/totp/enable');

      if (response.data) {
        setQrCode(response.data.qrCode);
        setSecret(response.data.secret);
        setStep('verify');
      }
    } catch (error) {
      message.error('Failed to setup TOTP');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle verification
   * Requirements: SEC-002, SEC-003
   */
  const handleVerify = async () => {
    try {
      setLoading(true);

      const endpoint =
        method === 'sms' ? '/security/2fa/sms/verify' : '/security/2fa/totp/verify';

      const response = await api.post(endpoint, {
        code: verificationCode,
      });

      if (response.data) {
        setBackupCodes(response.data.backupCodes || []);
        setStep('backup');
        message.success('2FA enabled successfully');
      }
    } catch (error) {
      message.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy backup codes to clipboard
   * Requirements: SEC-009
   */
  const copyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    message.success('Backup codes copied to clipboard');
  };

  /**
   * Complete setup
   */
  const handleComplete = () => {
    message.success('Two-factor authentication is now enabled');
    onSuccess?.();
  };

  return (
    <Card title="Set Up Two-Factor Authentication" loading={loading}>
      {step === 'method' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Two-factor authentication adds an extra layer of security to your account"
            type="info"
            showIcon
          />

          <Form layout="vertical">
            <Form.Item label="Choose authentication method">
              <Radio.Group value={method} onChange={(e) => setMethod(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="sms">
                    <PhoneOutlined /> SMS (Text Message)
                  </Radio>
                  <Radio value="totp">
                    <QrcodeOutlined /> Authenticator App (TOTP)
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {method === 'sms' && (
              <Form.Item label="Phone Number" required>
                <Input
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                onClick={() => (method === 'sms' ? handleSMSSetup() : handleTOTPSetup())}
                loading={loading}
                block
              >
                Continue
              </Button>
            </Form.Item>
          </Form>
        </Space>
      )}

      {step === 'verify' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          {method === 'totp' && qrCode && (
            <>
              <Alert
                message="Scan this QR code with your authenticator app"
                type="info"
                showIcon
              />
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img src={qrCode} alt="QR Code" style={{ maxWidth: '200px' }} />
              </div>
              <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                <strong>Manual entry key:</strong>
                <div style={{ fontFamily: 'monospace', marginTop: '5px' }}>{secret}</div>
              </div>
            </>
          )}

          <Form layout="vertical">
            <Form.Item label="Verification Code" required>
              <Input
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                disabled={loading}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                onClick={handleVerify}
                loading={loading}
                block
              >
                Verify
              </Button>
            </Form.Item>
          </Form>
        </Space>
      )}

      {step === 'backup' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Save your backup codes in a safe place"
            description="You can use these codes to access your account if you lose access to your authentication method"
            type="warning"
            showIcon
          />

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
            <div style={{ fontFamily: 'monospace', lineHeight: '1.8' }}>
              {backupCodes.map((code, index) => (
                <div key={index}>{code}</div>
              ))}
            </div>
          </div>

          <Button
            icon={<CopyOutlined />}
            onClick={copyBackupCodes}
            block
          >
            Copy Backup Codes
          </Button>

          <Divider />

          <Form.Item>
            <Button
              type="primary"
              onClick={handleComplete}
              block
            >
              I've Saved My Backup Codes
            </Button>
          </Form.Item>
        </Space>
      )}
    </Card>
  );
};

export default TwoFactorSetup;
