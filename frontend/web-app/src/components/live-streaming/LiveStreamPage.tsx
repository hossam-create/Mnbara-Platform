import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tabs, message } from 'antd';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import {
  LiveStreamPlayer,
  LiveStreamCreator,
  LiveStreamDiscovery,
  LiveStreamAnalytics,
  LiveStreamChat,
  LiveStreamAuction,
  StreamModeration
} from './index';
import styles from './LiveStreamPage.module.css';

const { TabPane } = Tabs;

interface LiveStreamPageProps {
  userId: string;
  username: string;
  isStreamer?: boolean;
  isModerator?: boolean;
  streamId?: string;
  onStreamSelect?: (streamId: string) => void;
}

interface StreamData {
  id: string;
  title: string;
  description: string;
  category: string;
  isLive: boolean;
  viewerCount: number;
  streamerId: string;
  streamerName: string;
  thumbnail?: string;
  tags: string[];
  auctionEnabled: boolean;
}

interface AuctionItem {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  currentBidder?: string;
  timeLeft: number;
  totalBids: number;
  image?: string;
  startingPrice: number;
  sellerId: string;
  sellerName: string;
}

const LiveStreamPage: React.FC<LiveStreamPageProps> = ({
  userId,
  username,
  isStreamer = false,
  isModerator = false,
  streamId,
  onStreamSelect
}) => {
  const { t } = useTranslation();
  const [socket, setSocket] = useState<any>(null);
  const [selectedStream, setSelectedStream] = useState<string>(streamId || '');
  const [currentStream, setCurrentStream] = useState<StreamData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('discovery');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentAuction, setCurrentAuction] = useState<AuctionItem | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_LIVE_SERVICE_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to live service');
      message.success(t('common.connected'));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from live service');
      message.warning(t('common.disconnected'));
    });

    newSocket.on('stream-update', (data: StreamData) => {
      setCurrentStream(data);
      if (data.id === selectedStream) {
        setCurrentStream(data);
      }
    });

    newSocket.on('auction-update', (auction: AuctionItem) => {
      setCurrentAuction(auction);
    });

    newSocket.on('chat-message', (message: any) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('analytics-update', (data: any) => {
      setAnalyticsData(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [selectedStream, t]);

  useEffect(() => {
    if (selectedStream && socket) {
      socket.emit('join-stream', { streamId: selectedStream, userId, username });
    }
  }, [selectedStream, socket, userId, username]);

  const handleStreamSelect = (streamId: string) => {
    setSelectedStream(streamId);
    setActiveTab('player');
    onStreamSelect?.(streamId);
  };

  const handleStartStream = (streamData: any) => {
    setIsStreaming(true);
    setActiveTab('player');
    message.success(t('liveStream.streamStarted'));
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    message.success(t('liveStream.streamStopped'));
  };

  const handleBidPlaced = (amount: number) => {
    if (socket && currentAuction) {
      socket.emit('place-bid', {
        auctionId: currentAuction.id,
        amount,
        bidder: username,
        bidderId: userId
      });
    }
  };

  const handleMessageSent = (message: string) => {
    if (socket && selectedStream) {
      socket.emit('send-message', {
        streamId: selectedStream,
        userId,
        username,
        message,
        timestamp: Date.now()
      });
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('liveStream.title')}</h1>
        <div className={styles.userInfo}>
          <span className={styles.username}>{username}</span>
          {isStreamer && <span className={styles.streamerBadge}>{t('common.streamer')}</span>}
        </div>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange} className={styles.tabs}>
        <TabPane tab={t('liveStream.discoverStreams')} key="discovery">
          <LiveStreamDiscovery
            onStreamSelect={handleStreamSelect}
            category="all"
          />
        </TabPane>

        {isStreamer && (
          <TabPane tab={t('liveStream.createStream')} key="creator">
            <LiveStreamCreator
              onStartStream={handleStartStream}
              onStopStream={handleStopStream}
              isStreaming={isStreaming}
            />
          </TabPane>
        )}

        {selectedStream && (
          <TabPane tab={t('liveStream.watchStream')} key="player">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card className={styles.playerCard}>
                  <LiveStreamPlayer
                    streamId={selectedStream}
                    streamKey={currentStream?.streamerId || ''}
                    title={currentStream?.title || ''}
                    isLive={currentStream?.isLive || false}
                    viewerCount={currentStream?.viewerCount || 0}
                    duration={0}
                    onStreamEnd={() => setSelectedStream('')}
                  />
                </Card>
              </Col>
              
              <Col xs={24} lg={8}>
                <Row gutter={[16, 16]}>
                  {currentStream?.auctionEnabled && currentAuction && (
                    <Col span={24}>
                      <Card title={t('auction.title')} size="small">
                        <LiveStreamAuction
                          streamId={selectedStream}
                          userId={userId}
                          username={username}
                          isStreamer={isStreamer}
                          onBidPlaced={handleBidPlaced}
                        />
                      </Card>
                    </Col>
                  )}
                  
                  <Col span={24}>
                    <Card title={t('chat.liveChat')} size="small">
                      <LiveStreamChat
                        streamId={selectedStream}
                        userId={userId}
                        username={username}
                        isStreamer={isStreamer}
                        isModerator={false}
                        onMessageSent={handleMessageSent}
                      />
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </TabPane>
        )}

        {isStreamer && selectedStream && (
          <TabPane tab={t('analytics.streamAnalytics')} key="analytics">
            <LiveStreamAnalytics
              streamId={selectedStream}
              dateRange="today"
            />
          </TabPane>
        )}

        {(isStreamer || (selectedStream && isModerator)) && (
          <TabPane tab={t('moderation.moderation')} key="moderation">
            <StreamModeration
              streamId={selectedStream || ''}
              userId={userId}
              isStreamer={isStreamer}
              isModerator={isModerator || false}
              socket={socket}
            />
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default LiveStreamPage;