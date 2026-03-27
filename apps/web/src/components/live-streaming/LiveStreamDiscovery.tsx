import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Avatar, Typography, Space, Tag, Rate, message } from 'antd';
import { PlayCircleOutlined, EyeOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from './LiveStreamDiscovery.module.css';

const { Title, Text } = Typography;

interface LiveStream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  category: string;
  isLive: boolean;
  viewerCount: number;
  duration: number;
  tags: string[];
  startingBid?: number;
  currentBid?: number;
  currency: string;
  isAuction: boolean;
  rating: number;
  likeCount: number;
  createdAt: string;
}

interface LiveStreamDiscoveryProps {
  onStreamSelect: (stream: LiveStream) => void;
  category?: string;
}

export const LiveStreamDiscovery: React.FC<LiveStreamDiscoveryProps> = ({
  onStreamSelect,
  category
}) => {
  const { t } = useTranslation();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'all',
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

  useEffect(() => {
    fetchStreams();
    
    // Refresh streams every 30 seconds
    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.REACT_APP_LIVE_SERVICE_URL || 'http://localhost:3000';
      const response = await fetch(
        `${baseUrl}/api/streams${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setStreams(data.streams || []);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      message.error(t('liveStream.errorFetchingStreams'));
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const StreamCard: React.FC<{ stream: LiveStream }> = ({ stream }) => (
    <Card
      hoverable
      className={styles.streamCard}
      onClick={() => onStreamSelect(stream)}
      cover={
        <div className={styles.thumbnailContainer}>
          <img
            alt={stream.title}
            src={stream.thumbnail || '/api/placeholder/400/225'}
            className={styles.thumbnail}
          />
          <div className={styles.overlay}>
            <div className={styles.liveBadge}>
              <Badge status="processing" text={t('liveStream.live')} />
            </div>
            <div className={styles.viewerBadge}>
              <EyeOutlined />
              <span>{formatViewerCount(stream.viewerCount)}</span>
            </div>
            <div className={styles.playButton}>
              <PlayCircleOutlined />
            </div>
          </div>
        </div>
      }
    >
      <div className={styles.streamContent}>
        <div className={styles.streamHeader}>
          <Title level={4} className={styles.streamTitle}>
            {stream.title}
          </Title>
          {stream.isAuction && (
            <Tag color="orange" className={styles.auctionTag}>
              {t('liveStream.auction')}
            </Tag>
          )}
        </div>
        
        <Text className={styles.description} ellipsis={{ rows: 2 }}>
          {stream.description}
        </Text>
        
        <div className={styles.sellerInfo}>
          <Avatar
            src={stream.sellerAvatar}
            icon={!stream.sellerAvatar && <UserOutlined />}
            size="small"
          />
          <Text className={styles.sellerName}>{stream.sellerName}</Text>
          <Rate disabled defaultValue={stream.rating} className={styles.rating} />
        </div>
        
        <div className={styles.streamMeta}>
          <Space size="small">
            <Tag className={styles.categoryTag}>{stream.category}</Tag>
            {stream.tags.slice(0, 2).map((tag, index) => (
              <Tag key={index} className={styles.tag}>{tag}</Tag>
            ))}
          </Space>
        </div>
        
        {stream.isAuction && stream.currentBid && (
          <div className={styles.auctionInfo}>
            <Text className={styles.currentBidLabel}>
              {t('liveStream.currentBid')}:
            </Text>
            <Text className={styles.currentBidAmount}>
              {stream.currency} {stream.currentBid.toFixed(2)}
            </Text>
          </div>
        )}
        
        <div className={styles.streamFooter}>
          <Space size="small" className={styles.duration}>
            <ClockCircleOutlined />
            <Text>{formatDuration(stream.duration)}</Text>
          </Space>
          
          <Space size="small" className={styles.actions}>
            <Button
              type="text"
              icon={<HeartOutlined />}
              size="small"
              className={styles.likeButton}
            >
              {stream.likeCount}
            </Button>
            <Button
              type="primary"
              size="small"
              className={styles.watchButton}
            >
              {t('liveStream.watchNow')}
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Title level={2} className={styles.title}>
            {t('liveStream.discoverStreams')}
          </Title>
          <Text className={styles.subtitle}>
            {t('liveStream.discoverStreamsSubtitle')}
          </Text>
        </div>
        
        <div className={styles.categoryFilter}>
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            className={styles.categorySelect}
          >
            {categories.map((category) => (
              <Select.Option key={category} value={category}>
                {t(`categories.${category.toLowerCase()}`)}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
      
      <div className={styles.statsBar}>
        <Space size="large">
          <div className={styles.stat}>
            <Text className={styles.statLabel}>{t('liveStream.totalStreams')}</Text>
            <Text className={styles.statValue}>{streams.length}</Text>
          </div>
          <div className={styles.stat}>
            <Text className={styles.statLabel}>{t('liveStream.liveNow')}</Text>
            <Text className={styles.statValue}>
              {streams.filter(s => s.isLive).length}
            </Text>
          </div>
          <div className={styles.stat}>
            <Text className={styles.statLabel}>{t('liveStream.totalViewers')}</Text>
            <Text className={styles.statValue}>
              {formatViewerCount(streams.reduce((sum, s) => sum + s.viewerCount, 0))}
            </Text>
          </div>
        </Space>
      </div>
      
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, index) => (
              <Card key={index} className={styles.loadingCard}>
                <div className={styles.loadingThumbnail} />
                <div className={styles.loadingContent}>
                  <div className={styles.loadingTitle} />
                  <div className={styles.loadingDescription} />
                  <div className={styles.loadingMeta} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.streamsGrid}>
          {streams.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <PlayCircleOutlined />
              </div>
              <Title level={3}>{t('liveStream.noStreams')}</Title>
              <Text>{t('liveStream.noStreamsMessage')}</Text>
              <Button type="primary" size="large" className={styles.createStreamButton}>
                {t('liveStream.createFirstStream')}
              </Button>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {streams.map((stream) => (
                <Col key={stream.id} xs={24} sm={12} md={8} lg={6}>
                  <StreamCard stream={stream} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveStreamDiscovery;