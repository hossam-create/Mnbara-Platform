import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, Button, Badge, Progress, Avatar, Space, Typography, message } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, SoundOutlined, SoundMutedOutlined, FullscreenOutlined, MessageOutlined, HeartOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from './LiveStreamPlayer.module.css';

const { Title, Text } = Typography;

interface LiveStreamPlayerProps {
  streamId: string;
  streamKey: string;
  title: string;
  description?: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  category?: string;
  startingBid?: number;
  currency?: string;
  isAuction?: boolean;
  onBid?: (amount: number) => void;
  onChatMessage?: (message: string) => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  avatar?: string;
}

interface Viewer {
  id: string;
  username: string;
  avatar?: string;
}

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  streamId,
  streamKey,
  title,
  description,
  sellerId,
  sellerName,
  sellerAvatar,
  category,
  startingBid,
  currency = 'USD',
  isAuction = false,
  onBid,
  onChatMessage
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [currentBid, setCurrentBid] = useState(startingBid || 0);
  const [bidInput, setBidInput] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // HLS stream URL
  const hlsUrl = `http://localhost:8080/hls/${streamKey}.m3u8`;

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.REACT_APP_LIVE_SERVICE_URL || 'http://localhost:3000', {
      query: { streamId, userId: 'viewer-' + Date.now() }
    });

    newSocket.on('connect', () => {
      console.log('Connected to live stream server');
      newSocket.emit('join-stream', { streamId });
    });

    newSocket.on('stream-status', (data: { isLive: boolean; viewerCount: number; duration: number }) => {
      setIsLive(data.isLive);
      setViewerCount(data.viewerCount);
      setStreamDuration(data.duration);
    });

    newSocket.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('bid-update', (data: { amount: number; userId: string; username: string }) => {
      setCurrentBid(data.amount);
      message.success(`${data.username} bid $${data.amount.toFixed(2)}`);
    });

    newSocket.on('like-update', (data: { count: number }) => {
      setLikeCount(data.count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    if (videoRef.current && hlsUrl) {
      // Initialize HLS player
      const video = videoRef.current;
      
      // Simple HLS implementation using native video element
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = hlsUrl;
      }
    }
  }, [hlsUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleSendMessage = () => {
    if (chatInput.trim() && socket) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        userId: 'viewer-' + Date.now(),
        username: 'Viewer',
        message: chatInput.trim(),
        timestamp: new Date()
      };
      
      socket.emit('chat-message', {
        streamId,
        message: message.message,
        username: message.username
      });
      
      setChatMessages(prev => [...prev, message]);
      setChatInput('');
      
      if (onChatMessage) {
        onChatMessage(chatInput.trim());
      }
    }
  };

  const handlePlaceBid = () => {
    const bidAmount = parseFloat(bidInput);
    if (bidAmount > currentBid && socket) {
      socket.emit('place-bid', {
        streamId,
        amount: bidAmount,
        username: 'Bidder'
      });
      
      setCurrentBid(bidAmount);
      setBidInput('');
      
      if (onBid) {
        onBid(bidAmount);
      }
    } else {
      message.error(t('liveStream.bidTooLow'));
    }
  };

  const handleLike = () => {
    if (socket) {
      socket.emit('like-stream', { streamId });
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.streamContainer}>
      <div className={styles.videoSection}>
        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            className={styles.videoPlayer}
            controls={false}
            muted={isMuted}
            volume={volume}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Stream Overlay */}
          <div className={styles.streamOverlay}>
            <div className={styles.streamHeader}>
              <div className={styles.streamInfo}>
                <Badge status={isLive ? 'processing' : 'default'} text={isLive ? t('liveStream.live') : t('liveStream.offline')} />
                <Text className={styles.viewerCount}>
                  <EyeOutlined /> {viewerCount} {t('liveStream.viewers')}
                </Text>
                {isLive && (
                  <Text className={styles.duration}>
                    {formatDuration(streamDuration)}
                  </Text>
                )}
              </div>
              
              <div className={styles.streamActions}>
                <Button
                  type="text"
                  icon={<HeartOutlined />}
                  onClick={handleLike}
                  className={`${styles.likeButton} ${liked ? styles.liked : ''}`}
                >
                  {likeCount}
                </Button>
                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  onClick={() => setShowChat(!showChat)}
                />
              </div>
            </div>
            
            <div className={styles.streamTitle}>
              <Title level={3}>{title}</Title>
              {description && <Text>{description}</Text>}
            </div>
            
            {isAuction && (
              <div className={styles.auctionInfo}>
                <Card size="small" className={styles.bidCard}>
                  <div className={styles.currentBid}>
                    <Text>{t('liveStream.currentBid')}</Text>
                    <Title level={2}>${currentBid.toFixed(2)}</Title>
                  </div>
                  <div className={styles.bidControls}>
                    <input
                      type="number"
                      value={bidInput}
                      onChange={(e) => setBidInput(e.target.value)}
                      placeholder={t('liveStream.enterBid')}
                      className={styles.bidInput}
                      min={currentBid + 0.01}
                      step={0.01}
                    />
                    <Button type="primary" onClick={handlePlaceBid}>
                      {t('liveStream.placeBid')}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
          
          {/* Video Controls */}
          <div className={styles.videoControls}>
            <Button
              type="text"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handlePlayPause}
              size="large"
            />
            
            <Button
              type="text"
              icon={isMuted ? <SoundMutedOutlined /> : <SoundOutlined />}
              onClick={handleMuteUnmute}
            />
            
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className={styles.volumeSlider}
            />
            
            <Button
              type="text"
              icon={<FullscreenOutlined />}
              onClick={handleFullscreen}
            />
          </div>
        </div>
      </div>
      
      {showChat && (
        <div className={styles.chatSection}>
          <div className={styles.chatHeader}>
            <Text strong>{t('liveStream.chat')}</Text>
            <Text type="secondary">{chatMessages.length} {t('liveStream.messages')}</Text>
          </div>
          
          <div className={styles.chatMessages}>
            {chatMessages.map((msg) => (
              <div key={msg.id} className={styles.chatMessage}>
                <div className={styles.messageHeader}>
                  <Text strong>{msg.username}</Text>
                  <Text type="secondary" className={styles.messageTime}>
                    {msg.timestamp.toLocaleTimeString()}
                  </Text>
                </div>
                <Text>{msg.message}</Text>
              </div>
            ))}
          </div>
          
          <div className={styles.chatInput}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('liveStream.typeMessage')}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className={styles.messageInput}
            />
            <Button type="primary" onClick={handleSendMessage}>
              {t('liveStream.send')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;