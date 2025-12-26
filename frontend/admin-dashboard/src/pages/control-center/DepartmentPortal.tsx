import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Progress, Avatar, Button, Space, Typography, Tabs, Table, Tag, Statistic, Alert, Tooltip, Drawer, Modal, Form, Input, Select, Switch, Divider, List, Timeline, Empty, Spin } from 'antd';
import { 
  UserOutlined, 
  SettingOutlined, 
  BarChartOutlined, 
  AlertOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  DatabaseOutlined,
  ApiOutlined,
  NotificationOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  ExperimentOutlined,
  SyncOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FilterOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DashboardOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  HeatMapOutlined,
  NodeIndexOutlined,
  ClusterOutlined,
  InteractionOutlined,
  PartitionOutlined,
  BlockOutlined,
  ApartmentOutlined,
  DeploymentUnitOutlined,
  HddOutlined,
  MemoryStickOutlined,
  UsbOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
  LaptopOutlined,
  CloudOutlined,
  WifiOutlined,
  GlobalOutlined,
  CompassOutlined,
  AimOutlined,
  TargetOutlined,
  ZoomInOutlined,
  MessageOutlined,
  PhoneOutlined,
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
  ClusterOutlined as ClusterIcon,
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
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAIAnalytics } from '../../hooks/useAIAnalytics';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { useRealTimeMonitoring } from '../../hooks/useRealTimeMonitoring';
import './DepartmentPortal.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface DepartmentData {
  id: string;
  name: string;
  description: string;
  status: 'online' | 'offline' | 'maintenance';
  users: number;
  performance: number;
  uptime: number;
  errorRate: number;
  responseTime: number;
  lastUpdate: string;
  icon: React.ReactNode;
  color: string;
  services: Service[];
  metrics: Metric[];
  alerts: Alert[];
  team: TeamMember[];
}

interface Service {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  version: string;
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  lastDeploy: string;
}

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'busy';
  avatar: string;
  specialization: string;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  acknowledged: boolean;
  assignedTo?: string;
}

const DepartmentPortal: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const { systemMetrics, systemHealth, refreshHealth } = useSystemHealth();
  const { aiInsights, generateInsight } = useAIAnalytics();
  const { realTimeData, isConnected } = useWebSocket('ws://localhost:8080/department');
  const { monitoringData, alerts, addAlert } = useRealTimeMonitoring();

  // Mock department data
  const [departmentData, setDepartmentData] = useState<DepartmentData | null>(null);

  useEffect(() => {
    const mockDepartments: { [key: string]: DepartmentData } = {
      auth: {
        id: 'auth',
        name: 'Authentication Service',
        description: 'User authentication, authorization, and identity management',
        status: 'online',
        users: 1234,
        performance: 98,
        uptime: 99.9,
        errorRate: 0.2,
        responseTime: 120,
        lastUpdate: '2 min ago',
        icon: <SafetyOutlined />,
        color: '#52c41a',
        services: [
          {
            id: 'auth-api',
            name: 'Auth API Gateway',
            status: 'running',
            version: '2.1.0',
            cpu: 45,
            memory: 68,
            requests: 1250,
            errors: 2,
            lastDeploy: '2024-01-15T10:30:00Z'
          },
          {
            id: 'auth-db',
            name: 'Auth Database',
            status: 'running',
            version: 'PostgreSQL 14',
            cpu: 25,
            memory: 85,
            requests: 450,
            errors: 0,
            lastDeploy: '2024-01-10T08:00:00Z'
          },
          {
            id: 'auth-cache',
            name: 'Auth Cache Layer',
            status: 'running',
            version: 'Redis 7.0',
            cpu: 15,
            memory: 35,
            requests: 2100,
            errors: 0,
            lastDeploy: '2024-01-12T14:20:00Z'
          }
        ],
        metrics: [
          { id: 'cpu', name: 'CPU Usage', value: 45, unit: '%', threshold: 80, status: 'healthy', trend: 'stable' },
          { id: 'memory', name: 'Memory Usage', value: 68, unit: '%', threshold: 85, status: 'healthy', trend: 'up' },
          { id: 'response_time', name: 'Response Time', value: 120, unit: 'ms', threshold: 500, status: 'healthy', trend: 'down' },
          { id: 'error_rate', name: 'Error Rate', value: 0.2, unit: '%', threshold: 5, status: 'healthy', trend: 'stable' }
        ],
        alerts: [
          {
            id: '1',
            type: 'performance',
            message: 'Memory usage trending upward',
            severity: 'low',
            timestamp: '2024-01-20T10:30:00Z',
            acknowledged: false
          },
          {
            id: '2',
            type: 'security',
            message: 'Unusual login pattern detected',
            severity: 'medium',
            timestamp: '2024-01-20T09:15:00Z',
            acknowledged: true,
            assignedTo: 'security-team'
          }
        ],
        team: [
          {
            id: '1',
            name: 'Ahmed Hassan',
            role: 'Lead Developer',
            status: 'online',
            avatar: 'AH',
            specialization: 'Authentication & Security'
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            role: 'DevOps Engineer',
            status: 'online',
            avatar: 'SJ',
            specialization: 'Infrastructure & Deployment'
          },
          {
            id: '3',
            name: 'Mohammed Ali',
            role: 'Security Analyst',
            status: 'busy',
            avatar: 'MA',
            specialization: 'Security Monitoring'
          }
        ]
      },
      payment: {
        id: 'payment',
        name: 'Payment Service',
        description: 'Payment processing, transaction management, and financial operations',
        status: 'online',
        users: 892,
        performance: 95,
        uptime: 99.5,
        errorRate: 1.2,
        responseTime: 280,
        lastUpdate: '1 min ago',
        icon: <DatabaseOutlined />,
        color: '#1890ff',
        services: [
          {
            id: 'payment-gateway',
            name: 'Payment Gateway',
            status: 'running',
            version: '3.2.1',
            cpu: 65,
            memory: 78,
            requests: 2100,
            errors: 25,
            lastDeploy: '2024-01-18T16:45:00Z'
          },
          {
            id: 'transaction-processor',
            name: 'Transaction Processor',
            status: 'running',
            version: '2.8.0',
            cpu: 55,
            memory: 82,
            requests: 1800,
            errors: 18,
            lastDeploy: '2024-01-17T11:30:00Z'
          }
        ],
        metrics: [
          { id: 'cpu', name: 'CPU Usage', value: 60, unit: '%', threshold: 80, status: 'healthy', trend: 'up' },
          { id: 'memory', name: 'Memory Usage', value: 80, unit: '%', threshold: 85, status: 'warning', trend: 'up' },
          { id: 'response_time', name: 'Response Time', value: 280, unit: 'ms', threshold: 500, status: 'warning', trend: 'up' },
          { id: 'error_rate', name: 'Error Rate', value: 1.2, unit: '%', threshold: 5, status: 'warning', trend: 'up' }
        ],
        alerts: [
          {
            id: '3',
            type: 'performance',
            message: 'High response time detected',
            severity: 'high',
            timestamp: '2024-01-20T11:00:00Z',
            acknowledged: false
          }
        ],
        team: [
          {
            id: '4',
            name: 'Fatima Rahman',
            role: 'Payment Lead',
            status: 'online',
            avatar: 'FR',
            specialization: 'Payment Systems'
          }
        ]
      },
      auction: {
        id: 'auction',
        name: 'Auction Service',
        description: 'Real-time auction management, bidding system, and marketplace operations',
        status: 'online',
        users: 567,
        performance: 92,
        uptime: 99.8,
        errorRate: 0.3,
        responseTime: 95,
        lastUpdate: '3 min ago',
        icon: <ThunderboltOutlined />,
        color: '#722ed1',
        services: [
          {
            id: 'auction-engine',
            name: 'Auction Engine',
            status: 'running',
            version: '1.5.2',
            cpu: 35,
            memory: 55,
            requests: 890,
            errors: 3,
            lastDeploy: '2024-01-19T09:00:00Z'
          }
        ],
        metrics: [
          { id: 'cpu', name: 'CPU Usage', value: 35, unit: '%', threshold: 80, status: 'healthy', trend: 'stable' },
          { id: 'memory', name: 'Memory Usage', value: 55, unit: '%', threshold: 85, status: 'healthy', trend: 'stable' },
          { id: 'response_time', name: 'Response Time', value: 95, unit: 'ms', threshold: 500, status: 'healthy', trend: 'stable' },
          { id: 'error_rate', name: 'Error Rate', value: 0.3, unit: '%', threshold: 5, status: 'healthy', trend: 'down' }
        ],
        alerts: [],
        team: [
          {
            id: '5',
            name: 'Khalid Omar',
            role: 'Auction Developer',
            status: 'online',
            avatar: 'KO',
            specialization: 'Real-time Systems'
          }
        ]
      }
    };

    if (departmentId && mockDepartments[departmentId]) {
      setDepartmentData(mockDepartments[departmentId]);
    }
  }, [departmentId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshHealth();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshHealth]);

  if (!departmentData) {
    return (
      <div className="department-portal-loading">
        <Spin size="large" />
        <Text>Loading department data...</Text>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'running':
        return '#52c41a';
      case 'warning':
      case 'maintenance':
        return '#fa8c16';
      case 'critical':
      case 'offline':
      case 'stopped':
      case 'error':
        return '#f5222d';
      default:
        return '#d9d9d9';
    }
  };

  const renderOverviewTab = () => (
    <div className="overview-tab">
      <Row gutter={[16, 16]}>
        {/* Key Metrics */}
        <Col span={24}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card className="metric-card">
                <Statistic
                  title="Active Users"
                  value={departmentData.users}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: departmentData.color }}
                />
                <Progress percent={departmentData.performance} size="small" strokeColor={departmentData.color} />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="metric-card">
                <Statistic
                  title="Performance"
                  value={departmentData.performance}
                  suffix="%"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: getStatusColor(departmentData.performance > 90 ? 'healthy' : departmentData.performance > 70 ? 'warning' : 'critical') }}
                />
                <Progress percent={departmentData.performance} size="small" />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="metric-card">
                <Statistic
                  title="Uptime"
                  value={departmentData.uptime}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: getStatusColor(departmentData.uptime > 99 ? 'healthy' : departmentData.uptime > 95 ? 'warning' : 'critical') }}
                />
                <Progress percent={departmentData.uptime} size="small" />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="metric-card">
                <Statistic
                  title="Response Time"
                  value={departmentData.responseTime}
                  suffix="ms"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: getStatusColor(departmentData.responseTime < 200 ? 'healthy' : departmentData.responseTime < 500 ? 'warning' : 'critical') }}
                />
                <Progress percent={(1 - departmentData.responseTime / 500) * 100} size="small" />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Performance Chart */}
        <Col span={16}>
          <Card title="Performance Trends" className="performance-chart">
            <Area
              data={realTimeData?.performance || []}
              xField="time"
              yField="value"
              smooth
              color={departmentData.color}
              animation={{ appear: { animation: 'path-in', duration: 1000 } }}
            />
          </Card>
        </Col>

        {/* Recent Alerts */}
        <Col span={8}>
          <Card title="Recent Alerts" className="recent-alerts">
            <Timeline>
              {departmentData.alerts.slice(0, 5).map((alert) => (
                <Timeline.Item
                  key={alert.id}
                  color={getStatusColor(alert.severity)}
                  dot={<AlertOutlined />}
                >
                  <div className="alert-item">
                    <Text strong>{alert.message}</Text>
                    <br />
                    <Text type="secondary">{new Date(alert.timestamp).toLocaleString()}</Text>
                    <br />
                    <Tag color={getStatusColor(alert.severity)}>{alert.severity}</Tag>
                    {alert.acknowledged && <Tag color="blue">Acknowledged</Tag>}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Services Status */}
        <Col span={24}>
          <Card title="Services Status" className="services-status">
            <Row gutter={[16, 16]}>
              {departmentData.services.map((service) => (
                <Col span={8} key={service.id}>
                  <motion.div
                    className="service-card"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(service)}
                  >
                    <Card size="small" className={service.status}>
                      <div className="service-header">
                        <Avatar style={{ backgroundColor: getStatusColor(service.status) }}>
                          <ServerOutlined />
                        </Avatar>
                        <div className="service-info">
                          <Text strong>{service.name}</Text>
                          <br />
                          <Badge status={service.status === 'running' ? 'success' : service.status === 'stopped' ? 'default' : 'error'} text={service.status} />
                        </div>
                      </div>
                      <div className="service-metrics">
                        <div className="metric-row">
                          <Text type="secondary">CPU: {service.cpu}%</Text>
                          <Progress percent={service.cpu} size="small" showInfo={false} />
                        </div>
                        <div className="metric-row">
                          <Text type="secondary">Memory: {service.memory}%</Text>
                          <Progress percent={service.memory} size="small" showInfo={false} />
                        </div>
                        <div className="metric-row">
                          <Text type="secondary">Requests: {service.requests}</Text>
                          <Text type="danger">Errors: {service.errors}</Text>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderServicesTab = () => (
    <div className="services-tab">
      <Table
        dataSource={departmentData.services}
        columns={[
          {
            title: 'Service Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record: Service) => (
              <div className="service-name">
                <Avatar style={{ backgroundColor: getStatusColor(record.status) }}>
                  <ServerOutlined />
                </Avatar>
                <div>
                  <Text strong>{text}</Text>
                  <br />
                  <Text type="secondary">{record.version}</Text>
                </div>
              </div>
            )
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
              <Badge status={status === 'running' ? 'success' : status === 'stopped' ? 'default' : 'error'} text={status} />
            )
          },
          {
            title: 'CPU',
            dataIndex: 'cpu',
            key: 'cpu',
            render: (value) => (
              <Progress percent={value} size="small" showInfo={false} />
            )
          },
          {
            title: 'Memory',
            dataIndex: 'memory',
            key: 'memory',
            render: (value) => (
              <Progress percent={value} size="small" showInfo={false} />
            )
          },
          {
            title: 'Requests',
            dataIndex: 'requests',
            key: 'requests'
          },
          {
            title: 'Errors',
            dataIndex: 'errors',
            key: 'errors',
            render: (value) => <Text type={value > 0 ? 'danger' : 'secondary'}>{value}</Text>
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record: Service) => (
              <Space>
                <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedService(record)}>
                  View
                </Button>
                <Button size="small" icon={<ReloadOutlined />}>
                  Restart
                </Button>
                <Button size="small" icon={<SettingOutlined />}>
                  Config
                </Button>
              </Space>
            )
          }
        ]}
        pagination={false}
      />
    </div>
  );

  const renderMetricsTab = () => (
    <div className="metrics-tab">
      <Row gutter={[16, 16]}>
        {departmentData.metrics.map((metric) => (
          <Col span={12} key={metric.id}>
            <Card className="metric-detail-card">
              <div className="metric-header">
                <Title level={4}>{metric.name}</Title>
                <Badge status={metric.status === 'healthy' ? 'success' : metric.status === 'warning' ? 'warning' : 'error'} />
              </div>
              <div className="metric-value">
                <Title level={2} style={{ color: getStatusColor(metric.status) }}>
                  {metric.value}
                </Title>
                <Text type="secondary">{metric.unit}</Text>
              </div>
              <Progress 
                percent={(metric.value / metric.threshold) * 100} 
                strokeColor={getStatusColor(metric.status)}
              />
              <div className="metric-details">
                <Text type="secondary">Threshold: {metric.threshold} {metric.unit}</Text>
                <br />
                <Text type="secondary">Trend: {metric.trend}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderTeamTab = () => (
    <div className="team-tab">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title="Team Members" 
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setTeamModalOpen(true)}>
                Add Member
              </Button>
            }
          >
            <List
              dataSource={departmentData.team}
              renderItem={(member) => (
                <List.Item
                  actions={[
                    <Button size="small" icon={<MessageOutlined />}>Message</Button>,
                    <Button size="small" icon={<VideoCameraOutlined />}>Call</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: getStatusColor(member.status) }}>
                        {member.avatar}
                      </Avatar>
                    }
                    title={
                      <div className="team-member-title">
                        <Text strong>{member.name}</Text>
                        <Badge status={member.status === 'online' ? 'success' : member.status === 'busy' ? 'warning' : 'default'} text={member.status} />
                      </div>
                    }
                    description={
                      <div>
                        <Text>{member.role}</Text>
                        <br />
                        <Text type="secondary">{member.specialization}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="alerts-tab">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title="System Alerts" 
            extra={
              <Space>
                <Button icon={<FilterOutlined />}>Filter</Button>
                <Button icon={<ReloadOutlined />} onClick={refreshHealth}>Refresh</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAlertModalOpen(true)}>
                  Create Alert
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={departmentData.alerts}
              columns={[
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type) => <Tag>{type}</Tag>
                },
                {
                  title: 'Message',
                  dataIndex: 'message',
                  key: 'message'
                },
                {
                  title: 'Severity',
                  dataIndex: 'severity',
                  key: 'severity',
                  render: (severity) => (
                    <Tag color={getStatusColor(severity)}>{severity}</Tag>
                  )
                },
                {
                  title: 'Time',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: (timestamp) => new Date(timestamp).toLocaleString()
                },
                {
                  title: 'Status',
                  dataIndex: 'acknowledged',
                  key: 'acknowledged',
                  render: (acknowledged) => (
                    <Badge status={acknowledged ? 'success' : 'warning'} text={acknowledged ? 'Acknowledged' : 'Pending'} />
                  )
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record: Alert) => (
                    <Space>
                      {!record.acknowledged && (
                        <Button size="small" type="primary">Acknowledge</Button>
                      )}
                      <Button size="small">Assign</Button>
                      <Button size="small">Resolve</Button>
                    </Space>
                  )
                }
              ]}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div className="department-portal">
      {/* Header */}
      <div className="department-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/control-center')}>
                Back to Control Center
              </Button>
              <Avatar size="large" style={{ backgroundColor: departmentData.color }}>
                {departmentData.icon}
              </Avatar>
              <div>
                <Title level={2} style={{ margin: 0 }}>{departmentData.name}</Title>
                <Text type="secondary">{departmentData.description}</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge status={departmentData.status === 'online' ? 'success' : departmentData.status === 'maintenance' ? 'warning' : 'error'} text={departmentData.status} />
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren={<SyncOutlined spin />}
                unCheckedChildren={<SyncOutlined />}
              />
              <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
                Settings
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Content */}
      <div className="department-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            {renderOverviewTab()}
          </TabPane>
          <TabPane tab="Services" key="services">
            {renderServicesTab()}
          </TabPane>
          <TabPane tab="Metrics" key="metrics">
            {renderMetricsTab()}
          </TabPane>
          <TabPane tab="Team" key="team">
            {renderTeamTab()}
          </TabPane>
          <TabPane tab="Alerts" key="alerts">
            {renderAlertsTab()}
          </TabPane>
        </Tabs>
      </div>

      {/* Service Detail Drawer */}
      <Drawer
        title={selectedService?.name}
        placement="right"
        onClose={() => setSelectedService(null)}
        open={!!selectedService}
        width={400}
      >
        {selectedService && (
          <div className="service-detail">
            <div className="service-status">
              <Badge status={selectedService.status === 'running' ? 'success' : selectedService.status === 'stopped' ? 'default' : 'error'} text={selectedService.status} />
              <Text type="secondary">Version: {selectedService.version}</Text>
            </div>
            
            <Divider />
            
            <div className="service-metrics-detail">
              <Title level={5}>Performance Metrics</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>CPU Usage</Text>
                  <Progress percent={selectedService.cpu} />
                </div>
                <div>
                  <Text>Memory Usage</Text>
                  <Progress percent={selectedService.memory} />
                </div>
                <div>
                  <Text>Request Rate</Text>
                  <Statistic value={selectedService.requests} suffix="req/min" />
                </div>
                <div>
                  <Text>Error Rate</Text>
                  <Statistic value={selectedService.errors} suffix="errors/min" />
                </div>
              </Space>
            </div>
            
            <Divider />
            
            <div className="service-actions">
              <Title level={5}>Actions</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button icon={<ReloadOutlined />} block>Restart Service</Button>
                <Button icon={<StopOutlined />} danger block>Stop Service</Button>
                <Button icon={<SettingOutlined />} block>Configuration</Button>
                <Button icon={<FileTextOutlined />} block>View Logs</Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        title="Department Settings"
        placement="right"
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="Auto Refresh">
            <Switch checked={autoRefresh} onChange={setAutoRefresh} />
          </Form.Item>
          <Form.Item label="Refresh Interval (seconds)">
            <Select value={refreshInterval} onChange={setRefreshInterval}>
              <Option value={10}>10 seconds</Option>
              <Option value={30}>30 seconds</Option>
              <Option value={60}>1 minute</Option>
              <Option value={300}>5 minutes</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Notification Threshold">
            <Select defaultValue="medium">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Team Modal */}
      <Modal
        title="Add Team Member"
        open={teamModalOpen}
        onCancel={() => setTeamModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Name" required>
            <Input placeholder="Enter member name" />
          </Form.Item>
          <Form.Item label="Role" required>
            <Select placeholder="Select role">
              <Option value="developer">Developer</Option>
              <Option value="devops">DevOps Engineer</Option>
              <Option value="analyst">Analyst</Option>
              <Option value="lead">Team Lead</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Specialization">
            <Input placeholder="Enter specialization" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">Add Member</Button>
              <Button onClick={() => setTeamModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Alert Modal */}
      <Modal
        title="Create Alert"
        open={alertModalOpen}
        onCancel={() => setAlertModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Alert Type" required>
            <Select placeholder="Select alert type">
              <Option value="performance">Performance</Option>
              <Option value="security">Security</Option>
              <Option value="resource">Resource</Option>
              <Option value="error">Error</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Message" required>
            <Input.TextArea rows={4} placeholder="Enter alert message" />
          </Form.Item>
          <Form.Item label="Severity" required>
            <Select placeholder="Select severity">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">Create Alert</Button>
              <Button onClick={() => setAlertModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentPortal;
