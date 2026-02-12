import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Upload, message, Form, Row, Col, Space, Typography, Switch } from 'antd';
import { UploadOutlined, CameraOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from './LiveStreamCreator.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface LiveStreamCreatorProps {
  onStartStream: (streamData: StreamData) => void;
  onStopStream: () => void;
  isStreaming: boolean;
}

interface StreamData {
  title: string;
  description: string;
  category: string;
  isAuction: boolean;
  startingBid?: number;
  currency: string;
  tags: string[];
  thumbnail?: string;
  privacy: 'public' | 'private' | 'unlisted';
  enableChat: boolean;
  enableBidding: boolean;
  durationLimit?: number;
}

export const LiveStreamCreator: React.FC<LiveStreamCreatorProps> = ({
  onStartStream,
  onStopStream,
  isStreaming
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [streamKey, setStreamKey] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [streamData, setStreamData] = useState<StreamData | null>(null);

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Collectibles',
    'Art',
    'Jewelry',
    'Automotive',
    'Books',
    'Toys'
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'AED', 'SAR'];

  useEffect(() => {
    // Generate stream key when component mounts
    generateStreamKey();
  }, []);

  const generateStreamKey = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/streams/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStreamKey(data.streamKey);
        setRtmpUrl(data.rtmpUrl);
      }
    } catch (error) {
      console.error('Error generating stream key:', error);
      message.error(t('liveStream.errorGeneratingKey'));
    }
  };

  const handleStartStream = async (values: any) => {
    const data: StreamData = {
      title: values.title,
      description: values.description,
      category: values.category,
      isAuction: values.isAuction,
      startingBid: values.startingBid,
      currency: values.currency,
      tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : [],
      thumbnail: values.thumbnail,
      privacy: values.privacy,
      enableChat: values.enableChat,
      enableBidding: values.enableBidding,
      durationLimit: values.durationLimit
    };

    try {
      const response = await fetch('http://localhost:3002/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          streamKey
        })
      });

      if (response.ok) {
        const result = await response.json();
        setStreamData(data);
        onStartStream(data);
        message.success(t('liveStream.streamStarted'));
      } else {
        message.error(t('liveStream.errorStartingStream'));
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      message.error(t('liveStream.errorStartingStream'));
    }
  };

  const handleStopStream = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/streams/${streamKey}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        onStopStream();
        setStreamData(null);
        message.success(t('liveStream.streamStopped'));
      }
    } catch (error) {
      console.error('Error stopping stream:', error);
      message.error(t('liveStream.errorStoppingStream'));
    }
  };

  const handleThumbnailUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
      form.setFieldsValue({ thumbnail: info.file.response?.url });
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const copyStreamKey = () => {
    navigator.clipboard.writeText(streamKey);
    message.success(t('liveStream.streamKeyCopied'));
  };

  const copyRtmpUrl = () => {
    navigator.clipboard.writeText(rtmpUrl);
    message.success(t('liveStream.rtmpUrlCopied'));
  };

  if (isStreaming && streamData) {
    return (
      <Card className={styles.streamingCard}>
        <div className={styles.streamingHeader}>
          <div className={styles.streamStatus}>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              <Text strong>{t('liveStream.live')}</Text>
            </div>
            <Text type="secondary">
              {t('liveStream.streamingAs')} {streamData.title}
            </Text>
          </div>
          
          <Button
            type="primary"
            danger
            onClick={handleStopStream}
            className={styles.stopButton}
          >
            {t('liveStream.stopStream')}
          </Button>
        </div>

        <div className={styles.streamInfo}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>{t('liveStream.streamKey')}:</Text>
              <div className={styles.streamKey}>
                <code>{streamKey}</code>
                <Button size="small" onClick={copyStreamKey}>
                  {t('common.copy')}
                </Button>
              </div>
            </Col>
            <Col span={12}>
              <Text strong>{t('liveStream.rtmpUrl')}:</Text>
              <div className={styles.rtmpUrl}>
                <code>{rtmpUrl}</code>
                <Button size="small" onClick={copyRtmpUrl}>
                  {t('common.copy')}
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        <div className={styles.streamingTips}>
          <Title level={4}>{t('liveStream.streamingTips')}</Title>
          <ul>
            <li>{t('liveStream.tip1')}</li>
            <li>{t('liveStream.tip2')}</li>
            <li>{t('liveStream.tip3')}</li>
            <li>{t('liveStream.tip4')}</li>
          </ul>
        </div>
      </Card>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.creatorCard}>
        <div className={styles.header}>
          <Title level={2}>
            <CameraOutlined /> {t('liveStream.createStream')}
          </Title>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setShowSettings(!showSettings)}
          >
            {t('liveStream.settings')}
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleStartStream}
          className={styles.streamForm}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                name="title"
                label={t('liveStream.streamTitle')}
                rules={[{ required: true, message: t('liveStream.titleRequired') }]}
              >
                <Input
                  placeholder={t('liveStream.titlePlaceholder')}
                  maxLength={100}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="description"
                label={t('liveStream.streamDescription')}
              >
                <TextArea
                  placeholder={t('liveStream.descriptionPlaceholder')}
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="category"
                label={t('liveStream.category')}
                rules={[{ required: true }]}
              >
                <Select placeholder={t('liveStream.selectCategory')}>
                  {categories.map((category) => (
                    <Option key={category} value={category}>
                      {t(`categories.${category.toLowerCase()}`)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="privacy"
                label={t('liveStream.privacy')}
                initialValue="public"
              >
                <Select>
                  <Option value="public">{t('liveStream.public')}</Option>
                  <Option value="private">{t('liveStream.private')}</Option>
                  <Option value="unlisted">{t('liveStream.unlisted')}</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="tags"
                label={t('liveStream.tags')}
              >
                <Input
                  placeholder={t('liveStream.tagsPlaceholder')}
                  maxLength={200}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="thumbnail"
                label={t('liveStream.thumbnail')}
              >
                <Upload
                  accept="image/*"
                  maxCount={1}
                  onChange={handleThumbnailUpload}
                  action="/api/upload/thumbnail"
                >
                  <Button icon={<UploadOutlined />}>
                    {t('liveStream.uploadThumbnail')}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="isAuction"
                label={t('liveStream.enableAuction')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.isAuction !== currentValues.isAuction}
            >
              {({ getFieldValue }) =>
                getFieldValue('isAuction') ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        name="startingBid"
                        label={t('liveStream.startingBid')}
                        rules={[{ required: true, type: 'number', min: 0.01 }]}
                      >
                        <Input type="number" min={0.01} step={0.01} />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item
                        name="currency"
                        label={t('liveStream.currency')}
                        initialValue="USD"
                      >
                        <Select>
                          {currencies.map((currency) => (
                            <Option key={currency} value={currency}>
                              {currency}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Form.Item
                        name="enableBidding"
                        label={t('liveStream.enableBidding')}
                        valuePropName="checked"
                        initialValue={true}
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </>
                ) : null
              }
            </Form.Item>

            {showSettings && (
              <>
                <Col span={24}>
                  <Form.Item
                    name="enableChat"
                    label={t('liveStream.enableChat')}
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="durationLimit"
                    label={t('liveStream.durationLimit')}
                  >
                    <Input
                      type="number"
                      placeholder={t('liveStream.minutes')}
                      min={30}
                      max={480}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" size="large">
                {t('liveStream.startStream')}
              </Button>
              <Button onClick={() => form.resetFields()}>
                {t('common.reset')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LiveStreamCreator;