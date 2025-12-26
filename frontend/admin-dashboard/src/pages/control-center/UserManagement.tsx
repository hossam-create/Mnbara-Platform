import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Space, Typography, Avatar, Badge, Tag, Modal, Form, Input, Select, Drawer, Tabs, List, Statistic, Progress, Tooltip, Divider, Alert, message, Popconfirm, Upload, Switch, Rate, Timeline, Empty, Spin } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  SettingOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  DownloadOutlined, 
  UploadOutlined, 
  SyncOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  GlobalOutlined, 
  SafetyOutlined, 
  DatabaseOutlined, 
  ApiOutlined, 
  NotificationOutlined, 
  ThunderboltOutlined, 
  RobotOutlined, 
  ExperimentOutlined, 
  BuildOutlined, 
  CodeOutlined, 
  BranchesOutlined, 
  MergeOutlined, 
  ForkOutlined, 
  PullRequestOutlined, 
  IssueOpenedOutlined, 
  CommitOutlined, 
  ReleaseOutlined, 
  PackageOutlined, 
  ContainerOutlined, 
  ServerOutlined, 
  ClusterOutlined, 
  HddOutlined, 
  MemoryStickOutlined, 
  UsbOutlined, 
  DesktopOutlined, 
  MobileOutlined, 
  TabletOutlined, 
  LaptopOutlined, 
  CloudOutlined, 
  WifiOutlined, 
  CompassOutlined, 
  AimOutlined, 
  TargetOutlined, 
  ZoomInOutlined, 
  MessageOutlined, 
  VideoCameraOutlined, 
  FileTextOutlined, 
  CalendarOutlined, 
  ScheduleOutlined, 
  HistoryOutlined, 
  AuditOutlined, 
  SecurityScanOutlined, 
  BugOutlined, 
  ToolOutlined, 
  WrenchOutlined, 
  RocketOutlined, 
  DashboardOutlined, 
  ControlOutlined, 
  LineChartOutlined, 
  BarChartOutlined, 
  PieChartOutlined, 
  AreaChartOutlined, 
  HeatMapOutlined, 
  RadarChartOutlined, 
  ScatterChartOutlined, 
  StockOutlined, 
  FundOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  ClockCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined, 
  LoadingOutlined, 
  FireOutlined, 
  ShieldOutlined, 
  HeartOutlined, 
  StarOutlined, 
  LikeOutlined, 
  DislikeOutlined, 
  ThumbsUpOutlined, 
  ThumbsDownOutlined, 
  CommentOutlined, 
  ShareAltOutlined, 
  LinkOutlined, 
  DisconnectOutlined, 
  ConnectOutlined, 
  ApiOutlined as ApiIcon, 
  DatabaseOutlined as DbIcon, 
  CloudServerOutlined, 
  MonitorOutlined, 
  DesktopOutlined as DesktopIcon, 
  LaptopOutlined as LaptopIcon, 
  MobileOutlined as MobileIcon, 
  TabletOutlined as TabletIcon
} from '@ant-design/icons';
import { Line, Area, Bar, Pie, Radar, Scatter, Heatmap } from '@ant-design/plots';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
  department: string;
  specialization: string[];
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin: string;
  joinDate: string;
  permissions: string[];
  skills: Skill[];
  performance: PerformanceMetrics;
  activity: ActivityLog[];
  projects: Project[];
  certifications: Certification[];
  training: Training[];
  notifications: Notification[];
  settings: UserSettings;
}

interface Skill {
  name: string;
  level: number;
  category: string;
  lastUsed: string;
  endorsements: number;
}

interface PerformanceMetrics {
  productivity: number;
  quality: number;
  collaboration: number;
  innovation: number;
  reliability: number;
  communication: number;
  overall: number;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  category: string;
  impact: 'low' | 'medium' | 'high';
}

interface Project {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'completed' | 'on-hold';
  progress: number;
  startDate: string;
  endDate?: string;
  contribution: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  status: 'valid' | 'expired' | 'pending';
  credentialId: string;
}

interface Training {
  id: string;
  title: string;
  provider: string;
  category: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  progress: number;
  startDate: string;
  endDate?: string;
  certificate?: string;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
}

interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorAuth: boolean;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  privacy: 'public' | 'team' | 'private';
  availability: 'available' | 'busy' | 'away' | 'offline';
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    department: '',
    role: '',
    status: '',
    specialization: ''
  });
  const [sortBy, setSortBy] = useState('joinDate');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards'>('table');

  // Mock users data
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'ahassan',
      email: 'ahmed.hassan@mnbara.com',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      avatar: 'AH',
      role: 'Senior Developer',
      department: 'auth',
      specialization: ['Authentication', 'Security', 'Backend Development'],
      status: 'active',
      lastLogin: '2024-01-20T10:30:00Z',
      joinDate: '2023-01-15T00:00:00Z',
      permissions: ['read', 'write', 'admin', 'deploy'],
      skills: [
        { name: 'React', level: 90, category: 'Frontend', lastUsed: '2024-01-19', endorsements: 15 },
        { name: 'Node.js', level: 85, category: 'Backend', lastUsed: '2024-01-20', endorsements: 12 },
        { name: 'Security', level: 80, category: 'Security', lastUsed: '2024-01-18', endorsements: 8 }
      ],
      performance: {
        productivity: 92,
        quality: 88,
        collaboration: 95,
        innovation: 85,
        reliability: 94,
        communication: 90,
        overall: 91
      },
      activity: [
        {
          id: '1',
          action: 'Code Commit',
          description: 'Fixed authentication bug in login service',
          timestamp: '2024-01-20T09:15:00Z',
          category: 'Development',
          impact: 'medium'
        },
        {
          id: '2',
          action: 'Code Review',
          description: 'Reviewed pull request for payment service',
          timestamp: '2024-01-20T08:30:00Z',
          category: 'Review',
          impact: 'low'
        }
      ],
      projects: [
        {
          id: '1',
          name: 'Authentication Service v2.0',
          role: 'Lead Developer',
          status: 'active',
          progress: 75,
          startDate: '2023-11-01T00:00:00Z',
          contribution: 'Core authentication logic and security implementation'
        }
      ],
      certifications: [
        {
          id: '1',
          name: 'AWS Certified Developer',
          issuer: 'Amazon Web Services',
          issueDate: '2023-06-15T00:00:00Z',
          expiryDate: '2026-06-15T00:00:00Z',
          status: 'valid',
          credentialId: 'AWS-DEV-123456'
        }
      ],
      training: [
        {
          id: '1',
          title: 'Advanced React Patterns',
          provider: 'Udemy',
          category: 'Frontend',
          status: 'completed',
          progress: 100,
          startDate: '2023-12-01T00:00:00Z',
          endDate: '2023-12-15T00:00:00Z',
          certificate: 'udemy-react-2023'
        }
      ],
      notifications: [
        {
          id: '1',
          type: 'info',
          title: 'New Assignment',
          message: 'You have been assigned to the authentication service project',
          timestamp: '2024-01-20T08:00:00Z',
          read: false,
          actionRequired: true
        }
      ],
      settings: {
        emailNotifications: true,
        pushNotifications: true,
        twoFactorAuth: true,
        language: 'en',
        timezone: 'UTC',
        theme: 'dark',
        privacy: 'team',
        availability: 'available'
      }
    },
    {
      id: '2',
      username: 'sjohnson',
      email: 'sarah.johnson@mnbara.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: 'SJ',
      role: 'DevOps Engineer',
      department: 'payment',
      specialization: ['DevOps', 'Cloud Infrastructure', 'CI/CD'],
      status: 'active',
      lastLogin: '2024-01-20T11:45:00Z',
      joinDate: '2023-03-10T00:00:00Z',
      permissions: ['read', 'write', 'deploy', 'admin'],
      skills: [
        { name: 'Kubernetes', level: 95, category: 'DevOps', lastUsed: '2024-01-20', endorsements: 20 },
        { name: 'Docker', level: 90, category: 'DevOps', lastUsed: '2024-01-19', endorsements: 18 },
        { name: 'AWS', level: 85, category: 'Cloud', lastUsed: '2024-01-18', endorsements: 15 }
      ],
      performance: {
        productivity: 88,
        quality: 92,
        collaboration: 90,
        innovation: 87,
        reliability: 96,
        communication: 85,
        overall: 90
      },
      activity: [],
      projects: [],
      certifications: [],
      training: [],
      notifications: [],
      settings: {
        emailNotifications: true,
        pushNotifications: false,
        twoFactorAuth: true,
        language: 'en',
        timezone: 'UTC',
        theme: 'dark',
        privacy: 'team',
        availability: 'busy'
      }
    },
    {
      id: '3',
      username: 'kali',
      email: 'khalid.ali@mnbara.com',
      firstName: 'Khalid',
      lastName: 'Ali',
      avatar: 'KA',
      role: 'Backend Developer',
      department: 'auction',
      specialization: ['Backend Development', 'Real-time Systems', 'Database Design'],
      status: 'active',
      lastLogin: '2024-01-20T09:20:00Z',
      joinDate: '2023-05-20T00:00:00Z',
      permissions: ['read', 'write'],
      skills: [
        { name: 'Python', level: 85, category: 'Backend', lastUsed: '2024-01-20', endorsements: 10 },
        { name: 'PostgreSQL', level: 80, category: 'Database', lastUsed: '2024-01-19', endorsements: 8 },
        { name: 'Redis', level: 75, category: 'Database', lastUsed: '2024-01-18', endorsements: 6 }
      ],
      performance: {
        productivity: 85,
        quality: 87,
        collaboration: 88,
        innovation: 82,
        reliability: 90,
        communication: 86,
        overall: 87
      },
      activity: [],
      projects: [],
      certifications: [],
      training: [],
      notifications: [],
      settings: {
        emailNotifications: true,
        pushNotifications: true,
        twoFactorAuth: false,
        language: 'en',
        timezone: 'UTC',
        theme: 'light',
        privacy: 'public',
        availability: 'available'
      }
    }
  ]);

  const departments = [
    { id: 'auth', name: 'Authentication', icon: <SafetyOutlined />, color: '#52c41a' },
    { id: 'payment', name: 'Payment', icon: <DatabaseOutlined />, color: '#1890ff' },
    { id: 'auction', name: 'Auction', icon: <ThunderboltOutlined />, color: '#722ed1' },
    { id: 'listing', name: 'Listing', icon: <ApiOutlined />, color: '#fa8c16' },
    { id: 'notification', name: 'Notification', icon: <NotificationOutlined />, color: '#eb2f96' },
    { id: 'ai-core', name: 'AI Core', icon: <RobotOutlined />, color: '#13c2c2' }
  ];

  const roles = [
    'Developer',
    'Senior Developer',
    'Lead Developer',
    'DevOps Engineer',
    'Security Analyst',
    'Product Manager',
    'UI/UX Designer',
    'QA Engineer',
    'System Administrator',
    'Data Scientist'
  ];

  const specializations = [
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'DevOps',
    'Cloud Infrastructure',
    'Security',
    'Database Administration',
    'Machine Learning',
    'UI/UX Design',
    'Quality Assurance',
    'Project Management',
    'Data Analysis'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#52c41a';
      case 'inactive':
        return '#d9d9d9';
      case 'suspended':
        return '#f5222d';
      case 'pending':
        return '#fa8c16';
      default:
        return '#d9d9d9';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#fa8c16';
    return '#f5222d';
  };

  const renderUsersTab = () => (
    <div className="users-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card className="users-header" bordered={false}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Title level={3} style={{ margin: 0 }}>User Management</Title>
                  <Badge count={users.filter(u => u.status === 'active').length} />
                </Space>
              </Col>
              <Col>
                <Space>
                  <Input
                    placeholder="Search users..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Select
                    placeholder="Filter Department"
                    value={filter.department}
                    onChange={(value) => setFilter(prev => ({ ...prev, department: value }))}
                    style={{ width: 150 }}
                  >
                    <Option value="">All Departments</Option>
                    {departments.map(dept => (
                      <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Filter Role"
                    value={filter.role}
                    onChange={(value) => setFilter(prev => ({ ...prev, role: value }))}
                    style={{ width: 150 }}
                  >
                    <Option value="">All Roles</Option>
                    {roles.map(role => (
                      <Option key={role} value={role}>{role}</Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Filter Status"
                    value={filter.status}
                    onChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
                    style={{ width: 120 }}
                  >
                    <Option value="">All Statuses</Option>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                    <Option value="suspended">Suspended</Option>
                    <Option value="pending">Pending</Option>
                  </Select>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                    Add User
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={18}>
          <Card title="Users" bordered={false}>
            {viewMode === 'table' ? (
              <Table
                dataSource={users
                  .filter(user => {
                    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesDepartment = !filter.department || user.department === filter.department;
                    const matchesRole = !filter.role || user.role === filter.role;
                    const matchesStatus = !filter.status || user.status === filter.status;
                    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
                  })}
                columns={[
                  {
                    title: 'User',
                    dataIndex: 'username',
                    key: 'user',
                    render: (_, record: User) => (
                      <div className="user-info">
                        <Avatar style={{ backgroundColor: getStatusColor(record.status) }}>
                          {record.avatar}
                        </Avatar>
                        <div>
                          <Text strong>{record.firstName} {record.lastName}</Text>
                          <br />
                          <Text type="secondary">@{record.username}</Text>
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Email',
                    dataIndex: 'email',
                    key: 'email'
                  },
                  {
                    title: 'Role',
                    dataIndex: 'role',
                    key: 'role'
                  },
                  {
                    title: 'Department',
                    dataIndex: 'department',
                    key: 'department',
                    render: (dept) => {
                      const deptInfo = departments.find(d => d.id === dept);
                      return deptInfo ? (
                        <Tag color={deptInfo.color}>{deptInfo.name}</Tag>
                      ) : dept;
                    }
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => (
                      <Badge status={status === 'active' ? 'success' : status === 'inactive' ? 'default' : status === 'suspended' ? 'error' : 'warning'} text={status} />
                    )
                  },
                  {
                    title: 'Performance',
                    dataIndex: 'performance',
                    key: 'performance',
                    render: (perf: PerformanceMetrics) => (
                      <div className="performance-score">
                        <Progress 
                          percent={perf.overall} 
                          size="small" 
                          strokeColor={getPerformanceColor(perf.overall)}
                          showInfo={false}
                        />
                        <Text style={{ color: getPerformanceColor(perf.overall) }}>
                          {perf.overall}%
                        </Text>
                      </div>
                    )
                  },
                  {
                    title: 'Last Login',
                    dataIndex: 'lastLogin',
                    key: 'lastLogin',
                    render: (date) => new Date(date).toLocaleDateString()
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, record: User) => (
                      <Space>
                        <Button size="small" icon={<EyeOutlined />} onClick={() => {
                          setSelectedUser(record);
                          setUserDetailOpen(true);
                        }}>
                          View
                        </Button>
                        <Button size="small" icon={<EditOutlined />}>
                          Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to suspend this user?"
                          onConfirm={() => message.success('User suspended')}
                        >
                          <Button size="small" danger icon={<StopOutlined />}>
                            Suspend
                          </Button>
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]}
                rowSelection={{
                  selectedRowKeys: selectedUsers,
                  onChange: setSelectedUsers
                }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true
                }}
              />
            ) : viewMode === 'grid' ? (
              <div className="users-grid">
                <Row gutter={[16, 16]}>
                  {users
                    .filter(user => {
                      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesDepartment = !filter.department || user.department === filter.department;
                      const matchesRole = !filter.role || user.role === filter.role;
                      const matchesStatus = !filter.status || user.status === filter.status;
                      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
                    })
                    .map((user) => (
                      <Col span={8} key={user.id}>
                        <motion.div
                          className="user-card"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDetailOpen(true);
                          }}
                        >
                          <Card
                            className="user-card-content"
                            bordered={false}
                            size="small"
                          >
                            <div className="user-card-header">
                              <Avatar size="large" style={{ backgroundColor: getStatusColor(user.status) }}>
                                {user.avatar}
                              </Avatar>
                              <div className="user-card-info">
                                <Title level={4}>{user.firstName} {user.lastName}</Title>
                                <Text type="secondary">@{user.username}</Text>
                                <br />
                                <Badge status={user.status === 'active' ? 'success' : user.status === 'inactive' ? 'default' : user.status === 'suspended' ? 'error' : 'warning'} text={user.status} />
                              </div>
                            </div>
                            
                            <div className="user-card-details">
                              <div className="detail-row">
                                <Text strong>Role:</Text>
                                <Text>{user.role}</Text>
                              </div>
                              <div className="detail-row">
                                <Text strong>Department:</Text>
                                <Tag color={departments.find(d => d.id === user.department)?.color}>
                                  {departments.find(d => d.id === user.department)?.name}
                                </Tag>
                              </div>
                              <div className="detail-row">
                                <Text strong>Performance:</Text>
                                <Progress 
                                  percent={user.performance.overall} 
                                  size="small" 
                                  strokeColor={getPerformanceColor(user.performance.overall)}
                                />
                              </div>
                            </div>
                            
                            <div className="user-card-skills">
                              <Text strong>Skills:</Text>
                              <div className="skill-tags">
                                {user.skills.slice(0, 3).map((skill) => (
                                  <Tag key={skill.name} size="small">{skill.name}</Tag>
                                ))}
                                {user.skills.length > 3 && (
                                  <Tag size="small">+{user.skills.length - 3} more</Tag>
                                )}
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      </Col>
                    ))}
                </Row>
              </div>
            ) : (
              <div className="users-cards">
                {/* Card view implementation */}
              </div>
            )}
          </Card>
        </Col>
        
        <Col span={6}>
          <Card title="Quick Stats" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="Total Users"
                value={users.length}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="Active Users"
                value={users.filter(u => u.status === 'active').length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Statistic
                title="Departments"
                value={departments.length}
                prefix={<ClusterOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <Statistic
                title="Avg Performance"
                value={Math.round(users.reduce((acc, u) => acc + u.performance.overall, 0) / users.length)}
                suffix="%"
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Space>
          </Card>
          
          <Card title="Department Distribution" bordered={false} style={{ marginTop: 16 }}>
            <Pie
              data={departments.map(dept => ({
                type: dept.name,
                value: users.filter(u => u.department === dept.id).length
              }))}
              angleField="value"
              colorField="type"
              color={departments.map(d => d.color)}
              height={200}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="analytics-tab">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="User Performance Trends" bordered={false}>
            <Area
              data={[
                { month: 'Jan', performance: 85, users: 45 },
                { month: 'Feb', performance: 87, users: 48 },
                { month: 'Mar', performance: 89, users: 52 },
                { month: 'Apr', performance: 88, users: 55 },
                { month: 'May', performance: 91, users: 58 },
                { month: 'Jun', performance: 90, users: 62 }
              ]}
              xField="month"
              yField="performance"
              smooth
              color="#1890ff"
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Skill Distribution" bordered={false}>
            <Bar
              data={[
                { skill: 'React', users: 25, level: 85 },
                { skill: 'Node.js', users: 20, level: 80 },
                { skill: 'Python', users: 18, level: 82 },
                { skill: 'Kubernetes', users: 15, level: 88 },
                { skill: 'AWS', users: 22, level: 79 }
              ]}
              xField="skill"
              yField="users"
              color="#52c41a"
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="Department Performance" bordered={false}>
            <Radar
              data={departments.map(dept => {
                const deptUsers = users.filter(u => u.department === dept.id);
                const avgPerformance = deptUsers.length > 0 
                  ? deptUsers.reduce((acc, u) => acc + u.performance.overall, 0) / deptUsers.length 
                  : 0;
                
                return {
                  department: dept.name,
                  performance: avgPerformance,
                  users: deptUsers.length,
                  satisfaction: Math.random() * 20 + 75,
                  productivity: Math.random() * 20 + 80
                };
              })}
              xField="department"
              yField="performance"
              area
              color="#722ed1"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderTeamsTab = () => (
    <div className="teams-tab">
      <Row gutter={[16, 16]}>
        {departments.map((dept) => {
          const deptUsers = users.filter(u => u.department === dept.id);
          const avgPerformance = deptUsers.length > 0 
            ? deptUsers.reduce((acc, u) => acc + u.performance.overall, 0) / deptUsers.length 
            : 0;
          
          return (
            <Col span={8} key={dept.id}>
              <Card
                title={
                  <Space>
                    <Avatar style={{ backgroundColor: dept.color }}>
                      {dept.icon}
                    </Avatar>
                    <span>{dept.name}</span>
                  </Space>
                }
                bordered={false}
                extra={
                  <Button size="small" icon={<EyeOutlined />}>
                    View Team
                  </Button>
                }
              >
                <div className="team-stats">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Members"
                        value={deptUsers.length}
                        prefix={<TeamOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Avg Performance"
                        value={Math.round(avgPerformance)}
                        suffix="%"
                        prefix={<BarChartOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                  </Row>
                </div>
                
                <Divider />
                
                <div className="team-members">
                  <Title level={5}>Team Members</Title>
                  <List
                    dataSource={deptUsers.slice(0, 3)}
                    renderItem={(user) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar style={{ backgroundColor: getStatusColor(user.status) }}>{user.avatar}</Avatar>}
                          title={`${user.firstName} ${user.lastName}`}
                          description={user.role}
                        />
                      </List.Item>
                    )}
                  />
                  {deptUsers.length > 3 && (
                    <Text type="secondary">+{deptUsers.length - 3} more members</Text>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );

  return (
    <div className="user-management">
      <div className="management-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                <TeamOutlined />
              </Avatar>
              <div>
                <Title level={2} style={{ margin: 0 }}>User Management</Title>
                <Text type="secondary">Manage users, teams, and permissions across all departments</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                value={viewMode}
                onChange={setViewMode}
                style={{ width: 120 }}
              >
                <Option value="table">Table</Option>
                <Option value="grid">Grid</Option>
                <Option value="cards">Cards</Option>
              </Select>
              <Button icon={<UploadOutlined />}>
                Import Users
              </Button>
              <Button icon={<DownloadOutlined />}>
                Export
              </Button>
              <Button icon={<SyncOutlined />} onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="management-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Users" key="users">
            {renderUsersTab()}
          </TabPane>
          <TabPane tab="Analytics" key="analytics">
            {renderAnalyticsTab()}
          </TabPane>
          <TabPane tab="Teams" key="teams">
            {renderTeamsTab()}
          </TabPane>
        </Tabs>
      </div>

      {/* User Detail Drawer */}
      <Drawer
        title={`${selectedUser?.firstName} ${selectedUser?.lastName}`}
        placement="right"
        onClose={() => setUserDetailOpen(false)}
        open={userDetailOpen}
        width={600}
      >
        {selectedUser && (
          <div className="user-detail">
            <div className="user-profile">
              <div className="profile-header">
                <Avatar size={80} style={{ backgroundColor: getStatusColor(selectedUser.status) }}>
                  {selectedUser.avatar}
                </Avatar>
                <div className="profile-info">
                  <Title level={3}>{selectedUser.firstName} {selectedUser.lastName}</Title>
                  <Text type="secondary">@{selectedUser.username}</Text>
                  <br />
                  <Badge status={selectedUser.status === 'active' ? 'success' : selectedUser.status === 'inactive' ? 'default' : selectedUser.status === 'suspended' ? 'error' : 'warning'} text={selectedUser.status} />
                  <br />
                  <Text>{selectedUser.role}</Text>
                </div>
              </div>
              
              <Divider />
              
              <div className="profile-details">
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Email:</Text>
                    <br />
                    <Text>{selectedUser.email}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Department:</Text>
                    <br />
                    <Tag color={departments.find(d => d.id === selectedUser.department)?.color}>
                      {departments.find(d => d.id === selectedUser.department)?.name}
                    </Tag>
                  </Col>
                </Row>
              </div>
            </div>

            <Divider />

            <div className="user-performance">
              <Title level={4}>Performance Metrics</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Overall Performance"
                    value={selectedUser.performance.overall}
                    suffix="%"
                    valueStyle={{ color: getPerformanceColor(selectedUser.performance.overall) }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Productivity"
                    value={selectedUser.performance.productivity}
                    suffix="%"
                    valueStyle={{ color: getPerformanceColor(selectedUser.performance.productivity) }}
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic
                    title="Quality"
                    value={selectedUser.performance.quality}
                    suffix="%"
                    valueStyle={{ color: getPerformanceColor(selectedUser.performance.quality) }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Collaboration"
                    value={selectedUser.performance.collaboration}
                    suffix="%"
                    valueStyle={{ color: getPerformanceColor(selectedUser.performance.collaboration) }}
                  />
                </Col>
              </Row>
            </div>

            <Divider />

            <div className="user-skills">
              <Title level={4}>Skills</Title>
              <List
                dataSource={selectedUser.skills}
                renderItem={(skill) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div className="skill-header">
                          <Text strong>{skill.name}</Text>
                          <Tag color="blue">{skill.category}</Tag>
                        </div>
                      }
                      description={
                        <div>
                          <Progress percent={skill.level} size="small" />
                          <Text type="secondary">Level: {skill.level} • Endorsed by {skill.endorsements} people</Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            <div className="user-actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" icon={<EditOutlined />} block>
                  Edit User
                </Button>
                <Button icon={<MessageOutlined />} block>
                  Send Message
                </Button>
                <Button icon={<VideoCameraOutlined />} block>
                  Video Call
                </Button>
                <Button danger icon={<StopOutlined />} block>
                  Suspend User
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create User Modal */}
      <Modal
        title="Add New User"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" required>
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" required>
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Email" required>
            <Input placeholder="Enter email address" />
          </Form.Item>
          <Form.Item label="Username" required>
            <Input placeholder="Enter username" />
          </Form.Item>
          <Form.Item label="Role" required>
            <Select placeholder="Select role">
              {roles.map(role => (
                <Option key={role} value={role}>{role}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Department" required>
            <Select placeholder="Select department">
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Specializations">
            <Select mode="multiple" placeholder="Select specializations">
              {specializations.map(spec => (
                <Option key={spec} value={spec}>{spec}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Permissions">
            <Select mode="multiple" placeholder="Select permissions">
              <Option value="read">Read</Option>
              <Option value="write">Write</Option>
              <Option value="admin">Admin</Option>
              <Option value="deploy">Deploy</Option>
              <Option value="manage">Manage</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">Create User</Button>
              <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
