import React, { useState, useEffect } from 'react';
import { Card, Button, InputNumber, Space, Typography, Badge, Progress, message, Modal, List, Avatar } from 'antd';
import { DollarOutlined, ClockCircleOutlined, TrophyOutlined, FireOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import styles from './LiveStreamAuction.module.css';

const { Title, Text, Paragraph } = Typography;

interface AuctionItem {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentBid: number;
  currentBidder: string;
  currentBidderId: string;
  imageUrl?: string;
  category: string;
  condition: string;
  timeLeft: number;
  totalBids: number;
  isActive: boolean;
  isSold: boolean;
  sellerId: string;
}

interface Bid {
  id: string;
  amount: number;
  bidder: string;
  bidderId: string;
  timestamp: number;
}

interface LiveStreamAuctionProps {
  streamId: string;
  userId: string;
  username: string;
  isStreamer?: boolean;
  onBidPlaced?: (bid: number) => void;
}

export const LiveStreamAuction: React.FC<LiveStreamAuctionProps> = ({
  streamId,
  userId,
  username,
  isStreamer = false,
  onBidPlaced
}) => {
  const { t } = useTranslation();
  const [currentItem, setCurrentItem] = useState<AuctionItem | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [newBid, setNewBid] = useState<number>(0);
  const [socket, setSocket] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [showBidHistory, setShowBidHistory] = useState<boolean>(false);
  const [bidIncrement, setBidIncrement] = useState<number>(1);

  useEffect(() => {
    const newSocket = io(`http://localhost:3002`, {
      query: { streamId, userId, username }
    });

    newSocket.on('connect', () => {
      console.log('Connected to auction server');
      newSocket.emit('join-auction', { streamId, username, isStreamer });
    });

    newSocket.on('auction-item', (item: AuctionItem) => {
      setCurrentItem(item);
      setTimeLeft(item.timeLeft);
      setNewBid(item.currentBid + bidIncrement);
    });

    newSocket.on('bid-update', (data: { item: AuctionItem; bid: Bid }) => {
      setCurrentItem(data.item);
      setBidHistory(prev => [data.bid, ...prev]);
      setNewBid(data.item.currentBid + bidIncrement);
      
      if (data.bid.bidderId === userId) {
        message.success(t('auction.bidSuccess'));
      }
    });

    newSocket.on('auction-ended', (item: AuctionItem) => {
      setCurrentItem(item);
      message.info(t('auction.ended'));
    });

    newSocket.on('auction-winner', (data: { item: AuctionItem; winner: string }) => {
      if (data.winner === username) {
        Modal.success({
          title: t('auction.congratulations'),
          content: t('auction.youWon', { item: data.item.title }),
          className: styles.winnerModal
        });
      }
    });

    newSocket.on('bid-error', (error: string) => {
      message.error(error);
      setIsBidding(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [streamId, userId, username, isStreamer, bidIncrement]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const placeBid = async () => {
    if (!socket || !currentItem || !newBid || isBidding) return;

    if (newBid <= currentItem.currentBid) {
      message.error(t('auction.bidTooLow'));
      return;
    }

    setIsBidding(true);
    
    socket.emit('place-bid', {
      itemId: currentItem.id,
      amount: newBid,
      bidder: username,
      bidderId: userId
    });

    onBidPlaced?.(newBid);
    
    setTimeout(() => setIsBidding(false), 2000);
  };

  const quickBid = (increment: number) => {
    if (currentItem) {
      setNewBid(currentItem.currentBid + increment);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTimeLeftColor = () => {
    if (timeLeft <= 60) return 'red';
    if (timeLeft <= 300) return 'orange';
    return 'green';
  };

  const getBidIncrement = () => {
    if (!currentItem) return 1;
    if (currentItem.currentBid < 10) return 1;
    if (currentItem.currentBid < 100) return 5;
    if (currentItem.currentBid < 500) return 10;
    return 25;
  };

  if (!currentItem) {
    return (
      <div className={styles.container}>
        <Card className={styles.emptyCard}>
          <div className={styles.emptyState}>
            <TrophyOutlined className={styles.emptyIcon} />
            <Title level={4} className={styles.emptyTitle}>
              {t('auction.noActiveAuction')}
            </Title>
            <Text type="secondary" className={styles.emptyText}>
              {t('auction.waitingForNext')}
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Row gutter={[24, 24]}>
        <Col span={16}>
          <Card className={styles.auctionCard}>
            <div className={styles.auctionHeader}>
              <div className={styles.itemInfo}>
                <Title level={3} className={styles.itemTitle}>
                  {currentItem.title}
                </Title>
                <Paragraph className={styles.itemDescription}>
                  {currentItem.description}
                </Paragraph>
                <Space className={styles.itemMeta}>
                  <Tag color="blue">{currentItem.category}</Tag>
                  <Tag color="green">{currentItem.condition}</Tag>
                  <Badge 
                    status={currentItem.isActive ? 'processing' : 'default'}
                    text={currentItem.isActive ? t('auction.live') : t('auction.ended')}
                  />
                </Space>
              </div>
              {currentItem.imageUrl && (
                <div className={styles.itemImage}>
                  <img src={currentItem.imageUrl} alt={currentItem.title} />
                </div>
              )}
            </div>

            <div className={styles.auctionStats}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card size="small" className={styles.statCard}>
                    <Statistic
                      title={t('auction.currentBid')}
                      value={currentItem.currentBid}
                      precision={2}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#ff6b6b', fontSize: '24px' }}
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className={styles.statCard}>
                    <Statistic
                      title={t('auction.timeLeft')}
                      value={formatTime(timeLeft)}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ 
                        color: getTimeLeftColor() === 'red' ? '#ff4d4f' : 
                               getTimeLeftColor() === 'orange' ? '#fa8c16' : '#52c41a',
                        fontSize: '24px'
                      }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className={styles.statCard}>
                    <Statistic
                      title={t('auction.totalBids')}
                      value={currentItem.totalBids}
                      prefix={<FireOutlined />}
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <div className={styles.biddingSection}>
              <Title level={4} className={styles.biddingTitle}>
                {t('auction.placeBid')}
              </Title>
              
              <div className={styles.quickBids}>
                <Space>
                  <Button onClick={() => quickBid(getBidIncrement())}>
                    +{formatCurrency(getBidIncrement())}
                  </Button>
                  <Button onClick={() => quickBid(getBidIncrement() * 2)}>
                    +{formatCurrency(getBidIncrement() * 2)}
                  </Button>
                  <Button onClick={() => quickBid(getBidIncrement() * 5)}>
                    +{formatCurrency(getBidIncrement() * 5)}
                  </Button>
                  <Button type="primary" onClick={() => quickBid(getBidIncrement() * 10)}>
                    +{formatCurrency(getBidIncrement() * 10)}
                  </Button>
                </Space>
              </div>

              <div className={styles.bidInputGroup}>
                <InputNumber
                  value={newBid}
                  onChange={(value) => setNewBid(value || 0)}
                  min={currentItem.currentBid + 0.01}
                  step={getBidIncrement()}
                  precision={2}
                  size="large"
                  className={styles.bidInput}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<DollarOutlined />}
                  onClick={placeBid}
                  loading={isBidding}
                  disabled={!currentItem.isActive || timeLeft <= 0 || newBid <= currentItem.currentBid}
                  className={styles.placeBidButton}
                >
                  {t('auction.placeBid')}
                </Button>
              </div>

              {currentItem.currentBidder && (
                <div className={styles.currentBidder}>
                  <Text type="secondary">
                    {t('auction.currentBidder')}: <Text strong>{currentItem.currentBidder}</Text>
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card className={styles.bidHistoryCard}>
            <div className={styles.bidHistoryHeader}>
              <Title level={4} className={styles.bidHistoryTitle}>
                {t('auction.bidHistory')}
              </Title>
              <Button
                type="link"
                onClick={() => setShowBidHistory(!showBidHistory)}
              >
                {showBidHistory ? t('common.hide') : t('common.show')}
              </Button>
            </div>

            {showBidHistory && (
              <List
                dataSource={bidHistory}
                renderItem={(bid) => (
                  <List.Item className={styles.bidItem}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <Space>
                          <Text strong>{bid.bidder}</Text>
                          <Text type="secondary" className={styles.bidTime}>
                            {new Date(bid.timestamp).toLocaleTimeString()}
                          </Text>
                        </Space>
                      }
                      description={
                        <Text strong style={{ color: '#ff6b6b' }}>
                          {formatCurrency(bid.amount)}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: t('auction.noBids') }}
                className={styles.bidHistoryList}
              />
            )}

            <div className={styles.auctionProgress}>
              <Progress
                percent={Math.max(0, Math.min(100, (timeLeft / 3600) * 100))}
                strokeColor={getTimeLeftColor()}
                format={() => formatTime(timeLeft)}
                className={styles.timeProgress}
              />
            </div>
          </Card>

          <Card className={styles.biddingTipsCard}>
            <Title level={5} className={styles.tipsTitle}>
              {t('auction.biddingTips')}
            </Title>
            <List
              size="small"
              dataSource={[
                t('auction.tip1'),
                t('auction.tip2'),
                t('auction.tip3'),
                t('auction.tip4')
              ]}
              renderItem={(tip) => (
                <List.Item className={styles.tipItem}>
                  <Text type="secondary">• {tip}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LiveStreamAuction;