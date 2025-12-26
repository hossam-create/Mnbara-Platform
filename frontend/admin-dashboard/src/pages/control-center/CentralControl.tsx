import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Alert, Badge, Progress, Tooltip, Button, Modal, Drawer, Typography, Statistic, Timeline, Switch, Slider, Input, Select, Space, Divider, Tag, Avatar, List, Spin, Empty } from 'antd';
import { 
  RadarChartOutlined, 
  AlertOutlined, 
  ThunderboltOutlined, 
  DatabaseOutlined, 
  TeamOutlined, 
  SettingOutlined, 
  EyeOutlined, 
  BugOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  GlobalOutlined,
  SafetyOutlined,
  ApiOutlined,
  CloudServerOutlined,
  MonitorOutlined,
  ExperimentOutlined,
  FireOutlined,
  ShieldOutlined,
  HeartOutlined,
  RobotOutlined,
  BulbOutlined,
  DashboardOutlined,
  ControlOutlined,
  FullscreenOutlined,
  SoundOutlined,
  WifiOutlined,
  BatteryFullOutlined,
  CompassOutlined,
  AimOutlined,
  TargetOutlined,
  ZoomInOutlined,
  NotificationOutlined,
  MessageOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  BarChartOutlined,
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
  ThunderboltOutlined as ThunderIcon,
  SyncOutlined
} from '@ant-design/icons';
import { Line, Area, Bar, Pie, Radar, Scatter, Heatmap } from '@ant-design/plots';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAIAnalytics } from '../../hooks/useAIAnalytics';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { useRealTimeMonitoring } from '../../hooks/useRealTimeMonitoring';
import './CentralControl.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

interface Department {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  users: number;
  alerts: number;
  performance: number;
  lastUpdate: string;
  icon: React.ReactNode;
  color: string;
}

interface AIInsight {
  id: string;
  type: 'anomaly' | 'prediction' | 'recommendation' | 'alert';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  department: string;
  confidence: number;
  actions?: string[];
}

interface Problem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  department: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  aiSuggestedSolution?: string;
  progress: number;
}

const CentralControl: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<SystemMetric | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'cockpit' | 'bridge' | 'command'>('cockpit');
  
  const cockpitRef = useRef<HTMLDivElement>(null);

  // Custom hooks for real-time data
  const { systemMetrics, systemHealth } = useSystemHealth();
  const { aiInsights, aiRecommendations } = useAIAnalytics();
  const { realTimeData, isConnected } = useWebSocket('ws://localhost:8080/control-center');
  const { monitoringData, alerts } = useRealTimeMonitoring();

  // Mock data for departments
  const [departments] = useState<Department[]>([
    { id: 'auth', name: 'Authentication', status: 'online', users: 1234, alerts: 2, performance: 98, lastUpdate: '2 min ago', icon: <SafetyOutlined />, color: '#52c41a' },
    { id: 'payment', name: 'Payment', status: 'online', users: 892, alerts: 0, performance: 95, lastUpdate: '1 min ago', icon: <DatabaseOutlined />, color: '#1890ff' },
    { id: 'auction', name: 'Auction', status: 'online', users: 567, alerts: 1, performance: 92, lastUpdate: '3 min ago', icon: <ThunderboltOutlined />, color: '#722ed1' },
    { id: 'listing', name: 'Listing', status: 'maintenance', users: 0, alerts: 0, performance: 0, lastUpdate: '15 min ago', icon: <ApiOutlined />, color: '#fa8c16' },
    { id: 'notification', name: 'Notification', status: 'online', users: 2341, alerts: 3, performance: 88, lastUpdate: '1 min ago', icon: <NotificationOutlined />, color: '#eb2f96' },
    { id: 'ai-core', name: 'AI Core', status: 'online', users: 45, alerts: 0, performance: 99, lastUpdate: '30 sec ago', icon: <RobotOutlined />, color: '#13c2c2' },
  ]);

  const [problems] = useState<Problem[]>([
    {
      id: '1',
      title: 'High latency in payment processing',
      description: 'Payment service experiencing 2x normal response time',
      severity: 'high',
      status: 'investigating',
      department: 'payment',
      assignedTo: 'AI Assistant',
      createdAt: '10 min ago',
      updatedAt: '2 min ago',
      aiSuggestedSolution: 'Scale payment service pods and optimize database queries',
      progress: 65
    },
    {
      id: '2',
      title: 'Memory leak in authentication service',
      description: 'Gradual memory increase detected in auth-service',
      severity: 'medium',
      status: 'open',
      department: 'auth',
      createdAt: '25 min ago',
      updatedAt: '10 min ago',
      aiSuggestedSolution: 'Restart service and apply memory optimization patch',
      progress: 30
    }
  ]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return '#52c41a';
      case 'warning':
      case 'maintenance':
        return '#fa8c16';
      case 'critical':
      case 'offline':
        return '#f5222d';
      default:
        return '#d9d9d9';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return '#52c41a';
      case 'medium':
        return '#fa8c16';
      case 'high':
        return '#fa541c';
      case 'critical':
        return '#f5222d';
      default:
        return '#d9d9d9';
    }
  };

  const renderCockpitView = () => (
    <div className="cockpit-view" ref={cockpitRef}>
      {/* Top Control Panel */}
      <div className="control-panel-top">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card className="system-status-card" bordered={false}>
              <div className="status-indicator">
                <Avatar size="large" style={{ backgroundColor: getStatusColor(systemHealth?.status || 'healthy') }}>
                  <MonitorOutlined />
                </Avatar>
                <div className="status-info">
                  <Title level={4}>System Status</Title>
                  <Text strong style={{ color: getStatusColor(systemHealth?.status || 'healthy') }}>
                    {systemHealth?.status?.toUpperCase() || 'HEALTHY'}
                  </Text>
                </div>
              </div>
              <Progress 
                percent={systemHealth?.overallHealth || 95} 
                strokeColor={getStatusColor(systemHealth?.status || 'healthy')}
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
          
          <Col span={6}>
            <Card className="ai-status-card" bordered={false}>
              <div className="ai-indicator">
                <Avatar size="large" style={{ backgroundColor: '#13c2c2' }}>
                  <RobotOutlined />
                </Avatar>
                <div className="ai-info">
                  <Title level={4}>AI Core</Title>
                  <Text strong style={{ color: '#13c2c2' }}>ACTIVE</Text>
                </div>
              </div>
              <div className="ai-metrics">
                <Text>Processing: {aiInsights?.length || 0} insights</Text>
              </div>
            </Card>
          </Col>

          <Col span={6}>
            <Card className="emergency-controls" bordered={false}>
              <Space direction="vertical" size="small">
                <Switch 
                  checked={emergencyMode}
                  onChange={setEmergencyMode}
                  checkedChildren={<AlertOutlined />}
                  unCheckedChildren={<SafetyOutlined />}
                />
                <Text>Emergency Mode</Text>
                <Switch 
                  checked={autoPilot}
                  onChange={setAutoPilot}
                  checkedChildren={<RocketOutlined />}
                  unCheckedChildren={<ControlOutlined />}
                />
                <Text>Auto-Pilot</Text>
              </Space>
            </Card>
          </Col>

          <Col span={6}>
            <Card className="system-controls" bordered={false}>
              <Space direction="vertical" size="small">
                <Switch 
                  checked={soundEnabled}
                  onChange={setSoundEnabled}
                  checkedChildren={<SoundOutlined />}
                  unCheckedChildren={<SoundOutlined />}
                />
                <Text>Sound</Text>
                <Switch 
                  checked={notificationsEnabled}
                  onChange={setNotificationsEnabled}
                  checkedChildren={<NotificationOutlined />}
                  unCheckedChildren={<NotificationOutlined />}
                />
                <Text>Notifications</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Cockpit Area */}
      <div className="main-cockpit">
        <Row gutter={[16, 16]}>
          {/* Left Panel - Department Status */}
          <Col span={6}>
            <Card title="Department Gates" className="department-gates" bordered={false}>
              <div className="department-list">
                {departments.map((dept) => (
                  <motion.div
                    key={dept.id}
                    className={`department-item ${selectedDepartment === dept.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDepartment(dept.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="department-header">
                      <Avatar style={{ backgroundColor: dept.color }}>
                        {dept.icon}
                      </Avatar>
                      <div className="department-info">
                        <Text strong>{dept.name}</Text>
                        <Badge 
                          status={dept.status === 'online' ? 'success' : dept.status === 'maintenance' ? 'warning' : 'error'}
                          text={dept.status}
                        />
                      </div>
                    </div>
                    <div className="department-metrics">
                      <Progress 
                        percent={dept.performance} 
                        size="small" 
                        showInfo={false}
                        strokeColor={dept.color}
                      />
                      <div className="metrics-row">
                        <Text type="secondary">Users: {dept.users}</Text>
                        <Text type="danger">Alerts: {dept.alerts}</Text>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </Col>

          {/* Center Panel - Main Dashboard */}
          <Col span={12}>
            <div className="center-dashboard">
              {/* System Performance Chart */}
              <Card title="System Performance" className="performance-chart" bordered={false}>
                <Area
                  data={realTimeData?.performance || []}
                  xField="time"
                  yField="value"
                  smooth
                  color="#1890ff"
                  animation={{ appear: { animation: 'path-in', duration: 1000 } }}
                />
              </Card>

              {/* AI Insights */}
              <Card title="AI Insights" className="ai-insights" bordered={false}>
                <Timeline>
                  {aiInsights?.slice(0, 5).map((insight) => (
                    <Timeline.Item
                      key={insight.id}
                      color={getSeverityColor(insight.severity)}
                      dot={<BulbOutlined />}
                    >
                      <div className="insight-item">
                        <Text strong>{insight.title}</Text>
                        <br />
                        <Text type="secondary">{insight.description}</Text>
                        <br />
                        <Tag color={getSeverityColor(insight.severity)}>{insight.severity}</Tag>
                        <Tag>{insight.department}</Tag>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>

              {/* Problem Tracking */}
              <Card title="Active Problems" className="problem-tracking" bordered={false}>
                <List
                  dataSource={problems}
                  renderItem={(problem) => (
                    <List.Item className="problem-item">
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: getSeverityColor(problem.severity) }}><BugOutlined /></Avatar>}
                        title={problem.title}
                        description={
                          <div>
                            <Text type="secondary">{problem.description}</Text>
                            <br />
                            <Progress percent={problem.progress} size="small" style={{ marginTop: 8 }} />
                            <div className="problem-actions">
                              <Tag color={getSeverityColor(problem.severity)}>{problem.severity}</Tag>
                              <Tag>{problem.status}</Tag>
                              <Tag>{problem.department}</Tag>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          </Col>

          {/* Right Panel - System Metrics */}
          <Col span={6}>
            <Card title="System Metrics" className="system-metrics" bordered={false}>
              <div className="metrics-grid">
                {systemMetrics?.map((metric) => (
                  <motion.div
                    key={metric.id}
                    className={`metric-card ${selectedMetric?.id === metric.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMetric(metric)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="metric-header">
                      <Text strong>{metric.name}</Text>
                      <Badge 
                        status={metric.status === 'healthy' ? 'success' : metric.status === 'warning' ? 'warning' : 'error'}
                      />
                    </div>
                    <div className="metric-value">
                      <Title level={2} style={{ color: getStatusColor(metric.status) }}>
                        {metric.value}
                      </Title>
                      <Text type="secondary">{metric.unit}</Text>
                    </div>
                    <Progress 
                      percent={(metric.value / metric.threshold) * 100} 
                      size="small" 
                      showInfo={false}
                      strokeColor={getStatusColor(metric.status)}
                    />
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions" className="quick-actions" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" icon={<SyncOutlined />} block>
                  Sync All Systems
                </Button>
                <Button icon={<ExperimentOutlined />} block>
                  Run Diagnostics
                </Button>
                <Button icon={<FileTextOutlined />} block>
                  Generate Report
                </Button>
                <Button danger icon={<AlertOutlined />} block>
                  Emergency Stop
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );

  const renderBridgeView = () => (
    <div className="bridge-view">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Bridge Command Center" bordered={false}>
            <div className="bridge-layout">
              {/* Navigation Chart */}
              <div className="navigation-chart">
                <Title level={4}>System Navigation</Title>
                <Radar
                  data={departments.map(dept => ({
                    department: dept.name,
                    performance: dept.performance,
                    users: dept.users / 10,
                    health: dept.status === 'online' ? 100 : dept.status === 'maintenance' ? 50 : 0
                  }))}
                  xField="department"
                  yField="performance"
                  area
                  color="#1890ff"
                />
              </div>

              {/* Command Deck */}
              <div className="command-deck">
                <Title level={4}>Command Deck</Title>
                <Row gutter={[16, 16]}>
                  {departments.map((dept) => (
                    <Col span={8} key={dept.id}>
                      <Card 
                        size="small"
                        className={`command-card ${dept.status}`}
                        hoverable
                      >
                        <div className="command-card-content">
                          <Avatar style={{ backgroundColor: dept.color }} size="large">
                            {dept.icon}
                          </Avatar>
                          <div className="command-info">
                            <Title level={5}>{dept.name}</Title>
                            <Text type="secondary">{dept.users} users</Text>
                            <br />
                            <Progress percent={dept.performance} size="small" />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderCommandView = () => (
    <div className="command-view">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Command Center Overview" bordered={false}>
            <div className="command-overview">
              {/* Strategic View */}
              <div className="strategic-view">
                <Title level={4}>Strategic Overview</Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card title="System Health Distribution" size="small">
                      <Pie
                        data={[
                          { type: 'Healthy', value: 70 },
                          { type: 'Warning', value: 20 },
                          { type: 'Critical', value: 10 }
                        ]}
                        angleField="value"
                        colorField="type"
                        color={['#52c41a', '#fa8c16', '#f5222d']}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Performance Trends" size="small">
                      <Line
                        data={realTimeData?.performance || []}
                        xField="time"
                        yField="value"
                        color="#1890ff"
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Tactical View */}
              <div className="tactical-view">
                <Title level={4}>Tactical Operations</Title>
                <List
                  dataSource={problems}
                  renderItem={(problem) => (
                    <List.Item
                      actions={[
                        <Button size="small" type="primary">View Details</Button>,
                        <Button size="small">Assign</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: getSeverityColor(problem.severity) }}><BugOutlined /></Avatar>}
                        title={problem.title}
                        description={`${problem.department} - ${problem.status}`}
                      />
                    </List.Item>
                  )}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div className={`central-control ${isFullscreen ? 'fullscreen' : ''} ${viewMode}`}>
      {/* Header */}
      <div className="control-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#fff' }}>
              <RocketOutlined /> Mnbara Central Control
            </Title>
          </Col>
          <Col>
            <Space>
              <Select
                value={viewMode}
                onChange={setViewMode}
                style={{ width: 120 }}
              >
                <Option value="cockpit">Cockpit</Option>
                <Option value="bridge">Bridge</Option>
                <Option value="command">Command</Option>
              </Select>
              <Button
                icon={<FullscreenOutlined />}
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </Button>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={() => setAiAssistantOpen(true)}
              >
                AI Assistant
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="control-content">
        <AnimatePresence mode="wait">
          {viewMode === 'cockpit' && (
            <motion.div
              key="cockpit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderCockpitView()}
            </motion.div>
          )}
          {viewMode === 'bridge' && (
            <motion.div
              key="bridge"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {renderBridgeView()}
            </motion.div>
          )}
          {viewMode === 'command' && (
            <motion.div
              key="command"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {renderCommandView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Assistant Drawer */}
      <Drawer
        title="AI Assistant"
        placement="right"
        onClose={() => setAiAssistantOpen(false)}
        open={aiAssistantOpen}
        width={400}
      >
        <div className="ai-assistant">
          <div className="ai-status">
            <Avatar size="large" style={{ backgroundColor: '#13c2c2' }}>
              <RobotOutlined />
            </Avatar>
            <div className="ai-info">
              <Title level={4}>AI Core Assistant</Title>
              <Text type="success">● Online and Ready</Text>
            </div>
          </div>
          
          <Divider />
          
          <div className="ai-insights">
            <Title level={5}>Recent Insights</Title>
            <List
              dataSource={aiInsights}
              renderItem={(insight) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: getSeverityColor(insight.severity) }}><BulbOutlined /></Avatar>}
                    title={insight.title}
                    description={insight.description}
                  />
                </List.Item>
              )}
            />
          </div>
          
          <Divider />
          
          <div className="ai-recommendations">
            <Title level={5}>Recommendations</Title>
            <List
              dataSource={aiRecommendations}
              renderItem={(rec) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}><TargetOutlined /></Avatar>}
                    title={rec.title}
                    description={rec.description}
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Drawer>

      {/* Emergency Alert Modal */}
      <Modal
        title="Emergency Alert"
        open={emergencyMode}
        onCancel={() => setEmergencyMode(false)}
        footer={[
          <Button key="cancel" onClick={() => setEmergencyMode(false)}>
            Cancel
          </Button>,
          <Button key="confirm" type="danger" onClick={() => setEmergencyMode(false)}>
            Confirm Emergency Protocol
          </Button>
        ]}
      >
        <Alert
          message="Emergency Mode Activated"
          description="All non-essential systems will be paused. Critical services will be maintained. Are you sure you want to continue?"
          type="warning"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default CentralControl;
