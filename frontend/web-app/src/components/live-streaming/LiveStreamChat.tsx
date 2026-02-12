import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, List, Avatar, Space, Typography, Badge, message } from 'antd';
import { SendOutlined, UserOutlined, HeartOutlined, LikeOutlined, SmileOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import styles from './LiveStreamChat.module.css';

const { Text, Paragraph } = Typography;

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  avatar?: string;
  isStreamer?: boolean;
  isModerator?: boolean;
  likes?: number;
  liked?: boolean;
}

interface LiveStreamChatProps {
  streamId: string;
  userId: string;
  username: string;
  isStreamer?: boolean;
  isModerator?: boolean;
  onMessageSent?: (message: string) => void;
}

export const LiveStreamChat: React.FC<LiveStreamChatProps> = ({
  streamId,
  userId,
  username,
  isStreamer = false,
  isModerator = false,
  onMessageSent
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😲', '😢', '😡', '👍', '👎', '❤️', '🔥', '🎉', '💯'];

  useEffect(() => {
    const newSocket = io(`http://localhost:3002`, {
      query: { streamId, userId, username }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      newSocket.emit('join-chat', { streamId, username, isStreamer, isModerator });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('chat-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('chat-history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    newSocket.on('user-count', (count: number) => {
      setUserCount(count);
    });

    newSocket.on('message-liked', (data: { messageId: string; likes: number; liked: boolean }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { ...msg, likes: data.likes, liked: data.liked }
            : msg
        )
      );
    });

    newSocket.on('message-deleted', (messageId: string) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [streamId, userId, username, isStreamer, isModerator]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    if (newMessage.length > 500) {
      message.warning(t('chat.messageTooLong'));
      return;
    }

    const messageData = {
      id: `msg-${Date.now()}-${Math.random()}`,
      userId,
      username,
      message: newMessage.trim(),
      timestamp: Date.now(),
      isStreamer,
      isModerator
    };

    socket.emit('send-message', messageData);
    setNewMessage('');
    onMessageSent?.(newMessage.trim());
  };

  const likeMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit('like-message', messageId);
  };

  const deleteMessage = (messageId: string) => {
    if (!socket || (!isStreamer && !isModerator)) return;
    socket.emit('delete-message', messageId);
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getUserBadge = (message: ChatMessage) => {
    if (message.isStreamer) {
      return <Badge.Ribbon text={t('chat.streamer')} color="red" placement="start" />;
    }
    if (message.isModerator) {
      return <Badge.Ribbon text={t('chat.moderator')} color="blue" placement="start" />;
    }
    return null;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.chatCard}>
        <div className={styles.chatHeader}>
          <Text strong className={styles.chatTitle}>
            {t('chat.liveChat')}
          </Text>
          <Space>
            <Badge 
              status={isConnected ? 'success' : 'error'} 
              text={isConnected ? t('chat.connected') : t('chat.disconnected')}
              className={styles.connectionStatus}
            />
            <Text type="secondary" className={styles.userCount}>
              <UserOutlined /> {userCount} {t('chat.users')}
            </Text>
          </Space>
        </div>

        <div className={styles.messagesContainer}>
          <List
            dataSource={messages}
            renderItem={(message) => (
              <List.Item className={styles.messageItem}>
                <div className={styles.messageContent}>
                  <div className={styles.messageHeader}>
                    <Space>
                      <Avatar 
                        size="small" 
                        icon={<UserOutlined />}
                        src={message.avatar}
                        className={message.isStreamer ? styles.streamerAvatar : ''}
                      />
                      <Text strong className={styles.username}>
                        {message.username}
                      </Text>
                      {getUserBadge(message)}
                      <Text type="secondary" className={styles.timestamp}>
                        {formatTime(message.timestamp)}
                      </Text>
                    </Space>
                    <Space className={styles.messageActions}>
                      <Button
                        type="text"
                        size="small"
                        icon={<LikeOutlined />}
                        onClick={() => likeMessage(message.id)}
                        className={`${styles.likeButton} ${message.liked ? styles.liked : ''}`}
                      >
                        {message.likes || 0}
                      </Button>
                      {(isStreamer || isModerator) && (
                        <Button
                          type="text"
                          size="small"
                          danger
                          onClick={() => deleteMessage(message.id)}
                          className={styles.deleteButton}
                        >
                          {t('chat.delete')}
                        </Button>
                      )}
                    </Space>
                  </div>
                  <Paragraph className={styles.messageText}>
                    {message.message}
                  </Paragraph>
                </div>
              </List.Item>
            )}
            className={styles.messagesList}
            locale={{ emptyText: t('chat.noMessages') }}
          />
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.chatInputContainer}>
          <div className={styles.emojiPicker}>
            <Space size="small">
              {emojis.map((emoji) => (
                <Button
                  key={emoji}
                  type="text"
                  size="small"
                  onClick={() => addEmoji(emoji)}
                  className={styles.emojiButton}
                >
                  {emoji}
                </Button>
              ))}
            </Space>
          </div>
          
          <div className={styles.inputGroup}>
            <Input.TextArea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chat.typeMessage')}
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={!isConnected}
              className={styles.messageInput}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={!isConnected || !newMessage.trim()}
              loading={!isConnected}
              className={styles.sendButton}
            >
              {t('chat.send')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LiveStreamChat;