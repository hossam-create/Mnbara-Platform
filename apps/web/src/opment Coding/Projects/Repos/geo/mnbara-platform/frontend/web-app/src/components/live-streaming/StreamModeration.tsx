import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, message, Modal, Switch } from 'antd';
import { DeleteOutlined, UserOutlined, ClockCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styles from './StreamModeration.module.css';

const { Search } = Input;
const { Option } = Select;

interface StreamModerationProps {
  streamId: string;
  userId: string;
  isStreamer: boolean;
  isModerator: boolean;
  socket?: any;
}

interface ModerationUser {
  id: string;
  username: string;
  role: 'streamer' | 'moderator' | 'viewer';
  status: 'active' | 'muted' | 'banned';
  joinTime: string;
  messageCount: number;
  violations: number;
  lastActivity: string;
}

interface ModerationAction {
  id: string;
  userId: string;
  username: string;
  action: 'mute' | 'unmute' | 'ban' | 'unban' | 'delete_message';
  reason?: string;
  moderator: string;
  timestamp: string;
}

const StreamModeration: React.FC<StreamModerationProps> = ({
  streamId,
  userId,
  isStreamer,
  isModerator,
  socket
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<ModerationUser[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [autoModeration, setAutoModeration] = useState(true);
  const [slowMode, setSlowMode] = useState(false);
  const [slowModeDelay, setSlowModeDelay] = useState(30);

  useEffect(() => {
    fetchUsers();
    fetchActions();

    if (socket) {
      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);
      socket.on('user-muted', handleUserMuted);
      socket.on('user-banned', handleUserBanned);
      socket.on('message-deleted', handleMessageDeleted);
    }

    return () => {
      if (socket) {
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
        socket.off('user-muted', handleUserMuted);
        socket.off('user-banned', handleUserBanned);
        socket.off('message-deleted', handleMessageDeleted);
      }
    };
  }, [streamId, socket]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Simulate API call
      const mockUsers: ModerationUser[] = [
        {
          id: '1',
          username: 'viewer1',
          role: 'viewer',
          status: 'active',
          joinTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          messageCount: 25,
          violations: 0,
          lastActivity: new Date(Date.now() - 1000 * 60 * 2).toISOString()
        },
        {
          id: '2',
          username: 'moderator1',
          role: 'moderator',
          status: 'active',
          joinTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          messageCount: 45,
          violations: 0,
          lastActivity: new Date(Date.now() - 1000 * 60 * 1).toISOString()
        },
        {
          id: '3',
          username: 'user123',
          role: 'viewer',
          status: 'muted',
          joinTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          messageCount: 15,
          violations: 2,
          lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      message.error(t('moderation.errorFetchingUsers'));
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      // Simulate API call
      const mockActions: ModerationAction[] = [
        {
          id: '1',
          userId: '3',
          username: 'user123',
          action: 'mute',
          reason: 'Spam messages',
          moderator: 'moderator1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          id: '2',
          userId: '4',
          username: 'spammer1',
          action: 'ban',
          reason: 'Repeated violations',
          moderator: 'streamer1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ];
      setActions(mockActions);
    } catch (error) {
      message.error(t('moderation.errorFetchingActions'));
    }
  };

  const handleUserJoined = (data: any) => {
    fetchUsers();
  };

  const handleUserLeft = (data: any) => {
    fetchUsers();
  };

  const handleUserMuted = (data: any) => {
    fetchUsers();
    fetchActions();
  };

  const handleUserBanned = (data: any) => {
    fetchUsers();
    fetchActions();
  };

  const handleMessageDeleted = (data: any) => {
    fetchActions();
  };

  const handleMuteUser = async (userId: string, username: string) => {
    Modal.confirm({
      title: t('moderation.muteUser'),
      content: t('moderation.muteUserConfirm', { username }),
      onOk: async () => {
        try {
          if (socket) {
            socket.emit('mute-user', {
              streamId,
              userId,
              moderator: userId,
              duration: 300 // 5 minutes
            });
          }
          message.success(t('moderation.userMuted'));
        } catch (error) {
          message.error(t('moderation.errorMutingUser'));
        }
      }
    });
  };

  const handleUnmuteUser = async (userId: string, username: string) => {
    try {
      if (socket) {
        socket.emit('unmute-user', {
          streamId,
          userId,
          moderator: userId
        });
      }
      message.success(t('moderation.userUnmuted'));
    } catch (error) {
      message.error(t('moderation.errorUnmutingUser'));
    }
  };

  const handleBanUser = async (userId: string, username: string) => {
    Modal.confirm({
      title: t('moderation.banUser'),
      content: t('moderation.banUserConfirm', { username }),
      onOk: async () => {
        try {
          if (socket) {
            socket.emit('ban-user', {
              streamId,
              userId,
              moderator: userId,
              reason: 'Manual ban by moderator'
            });
          }
          message.success(t('moderation.userBanned'));
        } catch (error) {
          message.error(t('moderation.errorBanningUser'));
        }
      }
    });
  };

  const handleAutoModerationChange = (checked: boolean) => {
    setAutoModeration(checked);
    if (socket) {
      socket.emit('update-stream-settings', {
        streamId,
        autoModeration: checked
      });
    }
    message.success(t('moderation.autoModerationUpdated'));
  };

  const handleSlowModeChange = (checked: boolean) => {
    setSlowMode(checked);
    if (socket) {
      socket.emit('update-stream-settings', {
        streamId,
        slowMode: checked,
        slowModeDelay: slowModeDelay
      });
    }
    message.success(t('moderation.slowModeUpdated'));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const userColumns = [
    {
      title: t('moderation.username'),
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: ModerationUser) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
          <Tag color={record.role === 'streamer' ? 'gold' : record.role === 'moderator' ? 'blue' : 'default'}>
            {t(`moderation.${record.role}`)}
          </Tag>
        </Space>
      )
    },
    {
      title: t('moderation.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'muted' ? 'orange' : 'red'}>
          {t(`moderation.${status}`)}
        </Tag>
      )
    },
    {
      title: t('moderation.joinTime'),
      dataIndex: 'joinTime',
      key: 'joinTime',
      render: (time: string) => (
        <Space>
          <ClockCircleOutlined />
          <span>{new Date(time).toLocaleTimeString()}</span>
        </Space>
      )
    },
    {
      title: t('moderation.messageCount'),
      dataIndex: 'messageCount',
      key: 'messageCount',
      align: 'center' as const
    },
    {
      title: t('moderation.violations'),
      dataIndex: 'violations',
      key: 'violations',
      align: 'center' as const,
      render: (violations: number) => (
        <span style={{ color: violations > 0 ? '#ff4d4f' : '#52c41a' }}>
          {violations}
        </span>
      )
    },
    {
      title: t('moderation.actions'),
      key: 'actions',
      render: (_: any, record: ModerationUser) => (
        <Space size="small">
          {record.status === 'active' && record.role === 'viewer' && (
            <Button
              size="small"
              type="text"
              danger
              onClick={() => handleMuteUser(record.id, record.username)}
            >
              {t('moderation.mute')}
            </Button>
          )}
          {record.status === 'muted' && record.role === 'viewer' && (
            <Button
              size="small"
              type="text"
              onClick={() => handleUnmuteUser(record.id, record.username)}
            >
              {t('moderation.unmute')}
            </Button>
          )}
          {record.role === 'viewer' && (
            <Button
              size="small"
              type="text"
              danger
              onClick={() => handleBanUser(record.id, record.username)}
            >
              {t('moderation.ban')}
            </Button>
          )}
        </Space>
      )
    }
  ];

  const actionColumns = [
    {
      title: t('moderation.user'),
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: t('moderation.action'),
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={action === 'mute' || action === 'ban' ? 'red' : 'green'}>
          {t(`moderation.${action}`)}
        </Tag>
      )
    },
    {
      title: t('moderation.reason'),
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: t('moderation.moderator'),
      dataIndex: 'moderator',
      key: 'moderator'
    },
    {
      title: t('moderation.timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => new Date(time).toLocaleString()
    }
  ];

  if (!isStreamer && !isModerator) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Card 
        title={t('moderation.streamModeration')} 
        className={styles.moderationCard}
        extra={
          <Space>
            <span>{t('moderation.autoModeration')}</span>
            <Switch 
              checked={autoModeration} 
              onChange={handleAutoModerationChange}
            />
            <span>{t('moderation.slowMode')}</span>
            <Switch 
              checked={slowMode} 
              onChange={handleSlowModeChange}
            />
            {slowMode && (
              <Select 
                value={slowModeDelay} 
                onChange={setSlowModeDelay}
                style={{ width: 100 }}
                size="small"
              >
                <Option value={10}>10s</Option>
                <Option value={30}>30s</Option>
                <Option value={60}>1m</Option>
                <Option value={300}>5m</Option>
              </Select>
            )}
          </Space>
        }
      >
        <div className={styles.filters}>
          <Space>
            <Search
              placeholder={t('moderation.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
              size="small"
            />
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="all">{t('moderation.allStatus')}</Option>
              <Option value="active">{t('moderation.active')}</Option>
              <Option value="muted">{t('moderation.muted')}</Option>
              <Option value="banned">{t('moderation.banned')}</Option>
            </Select>
            <Select 
              value={roleFilter} 
              onChange={setRoleFilter}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="all">{t('moderation.allRoles')}</Option>
              <Option value="viewer">{t('moderation.viewer')}</Option>
              <Option value="moderator">{t('moderation.moderator')}</Option>
            </Select>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
              size="small"
            >
              {t('moderation.clearFilters')}
            </Button>
          </Space>
        </div>

        <Table
          columns={userColumns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t('moderation.totalUsers', { total })
          }}
          className={styles.usersTable}
        />

        <div className={styles.actionsSection}>
          <h3>{t('moderation.recentActions')}</h3>
          <Table
            columns={actionColumns}
            dataSource={actions}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 5,
              showTotal: (total) => t('moderation.totalActions', { total })
            }}
            className={styles.actionsTable}
          />
        </div>
      </Card>
    </div>
  );
};

export default StreamModeration;