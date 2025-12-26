import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Avatar, Button, Space, Typography, Badge, Alert, Tooltip, Switch, Statistic, Timeline, Tag, Modal, Drawer } from 'antd';
import { 
  RocketOutlined,
  DashboardOutlined,
  AlertOutlined,
  SafetyOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  ApiOutlined,
  NotificationOutlined,
  MonitorOutlined,
  ControlOutlined,
  FullscreenOutlined,
  SoundOutlined,
  WifiOutlined,
  BatteryFullOutlined,
  CompassOutlined,
  AimOutlined,
  TargetOutlined,
  EyeOutlined,
  SettingOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  ShieldOutlined,
  HeartOutlined,
  GlobalOutlined,
  CloudServerOutlined,
  HddOutlined,
  MemoryStickOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { Line, Area, Gauge, Progress as AntProgress } from '@ant-design/plots';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './CockpitDashboard.css';

const { Title, Text } = Typography;

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
}

interface Department {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  health: number;
  alerts: number;
  icon: React.ReactNode;
  color: string;
}

const CockpitDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Mock system metrics
  const [systemMetrics] = useState<SystemMetric[]>([
    { id: '1', name: 'CPU Usage', value: 45, unit: '%', status: 'healthy', threshold: 80 },
    { id: '2', name: 'Memory', value: 67, unit: '%', status: 'warning', threshold: 85 },
    { id: '3', name: 'Disk I/O', value: 23, unit: 'MB/s', status: 'healthy', threshold: 100 },
    { id: '4', name: 'Network', value: 156, unit: 'Mbps', status: 'healthy', threshold: 1000 },
    { id: '5', name: 'Database', value: 89, unit: 'ms', status: 'warning', threshold: 100 },
    { id: '6', name: 'API Latency', value: 34, unit: 'ms', status: 'healthy', threshold: 200 }
  ]);

  // Mock departments
  const [departments] = useState<Department[]>([
    { id: 'auth', name: 'Authentication', status: 'online', health: 98, alerts: 0, icon: <SafetyOutlined />, color: '#52c41a' },
    { id: 'payment', name: 'Payment', status: 'online', health: 95, alerts: 1, icon: <DatabaseOutlined />, color: '#1890ff' },
    { id: 'auction', name: 'Auction', status: 'online', health: 92, alerts: 0, icon: <ThunderboltOutlined />, color: '#722ed1' },
    { id: 'listing', name: 'Listing', status: 'maintenance', health: 0, alerts: 0, icon: <ApiOutlined />, color: '#fa8c16' },
    { id: 'notification', name: 'Notification', status: 'online', health: 88, alerts: 2, icon: <NotificationOutlined />, color: '#eb2f96' },
    { id: 'ai-core', name: 'AI Core', status: 'online', health: 99, alerts: 0, icon: <RobotOutlined />, color: '#13c2c2' }
  ]);

  // Mock performance data
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 67, network: 156 },
    { time: '00:05', cpu: 48, memory: 69, network: 162 },
    { time: '00:10', cpu: 52, memory: 71, network: 158 },
    { time: '00:15', cpu: 49, memory: 68, network: 164 },
    { time: '00:20', cpu: 46, memory: 66, network: 160 },
    { time: '00:25', cpu: 44, memory: 65, network: 156 }
  ];

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

  const handleDepartmentClick = (departmentId: string) => {
    setSelectedDepartment(departmentId);
    navigate(`/department/${departmentId}`);
  };

  const handleEmergencyToggle = (checked: boolean) => {
    setEmergencyMode(checked);
    if (checked) {
      Modal.confirm({
        title: 'Emergency Mode Activation',
        content: 'This will activate emergency protocols. All non-essential systems will be paused. Continue?',
        okText: 'Activate',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          console.log('Emergency mode activated');
        },
        onCancel() {
          setEmergencyMode(false);
        }
      });
    }
  };

  return (
    <div className={`cockpit-dashboard ${isFullscreen ? 'fullscreen' : ''} ${emergencyMode ? 'emergency-mode' : ''}`}>
      {/* Cockpit Header */}
      <div className="cockpit-header">
        <div className="header-left">
          <Title level={2} style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RocketOutlined />
            Mnbara System Control
          </Title>
          <div className="system-status">
            <Badge status={systemStatus === 'healthy' ? 'success' : systemStatus === 'warning' ? 'warning' : 'error'} />
            <Text style={{ color: '#fff', marginLeft: 8 }}>
              System Status: {systemStatus.toUpperCase()}
            </Text>
          </div>
        </div>
        
        <div className="header-right">
          <Space size="large">
            <div className="connection-status">
              <WifiOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              <Text style={{ color: '#fff' }}>Connected</Text>
            </div>
            
            <Button
              icon={<FullscreenOutlined />}
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}
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
        </div>
      </div>

      {/* Main Cockpit Grid */}
      <div className="cockpit-grid">
        {/* Left Panel - System Controls */}
        <div className="cockpit-left-panel">
          <Card title="System Controls" className="glass-panel" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Emergency Controls */}
              <div className="control-section">
                <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Emergency Controls</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div className="control-item">
                    <Switch 
                      checked={emergencyMode}
                      onChange={handleEmergencyToggle}
                      checkedChildren={<AlertOutlined />}
                      unCheckedChildren={<SafetyOutlined />}
                    />
                    <Text style={{ color: '#fff', marginLeft: 12 }}>Emergency Mode</Text>
                  </div>
                  
                  <div className="control-item">
                    <Switch 
                      checked={autoPilot}
                      onChange={setAutoPilot}
                      checkedChildren={<RocketOutlined />}
                      unCheckedChildren={<ControlOutlined />}
                    />
                    <Text style={{ color: '#fff', marginLeft: 12 }}>Auto-Pilot</Text>
                  </div>
                  
                  <div className="control-item">
                    <Switch 
                      checked={soundEnabled}
                      onChange={setSoundEnabled}
                      checkedChildren={<SoundOutlined />}
                      unCheckedChildren={<SoundOutlined />}
                    />
                    <Text style={{ color: '#fff', marginLeft: 12 }}>Sound Alerts</Text>
                  </div>
                </Space>
              </div>

              {/* Quick Actions */}
              <div className="control-section">
                <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Quick Actions</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    block 
                    icon={<SyncOutlined />}
                    onClick={() => navigate('/system-health')}
                    style={{ background: 'rgba(24,144,255,0.2)', border: '1px solid #1890ff', color: '#fff' }}
                  >
                    System Health
                  </Button>
                  <Button 
                    block 
                    icon={<BugOutlined />}
                    onClick={() => navigate('/ai-solver')}
                    style={{ background: 'rgba(19,194,194,0.2)', border: '1px solid #13c2c2', color: '#fff' }}
                  >
                    AI Problem Solver
                  </Button>
                  <Button 
                    block 
                    icon={<ShieldOutlined />}
                    onClick={() => navigate('/security')}
                    style={{ background: 'rgba(114,46,209,0.2)', border: '1px solid #722ed1', color: '#fff' }}
                  >
                    Security Center
                  </Button>
                  <Button 
                    block 
                    icon={<MonitorOutlined />}
                    onClick={() => navigate('/performance')}
                    style={{ background: 'rgba(82,196,26,0.2)', border: '1px solid #52c41a', color: '#fff' }}
                  >
                    Performance
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>
        </div>

        {/* Center Panel - Main Display */}
        <div className="cockpit-main-display">
          {/* System Performance Chart */}
          <Card title="System Performance" className="glass-panel performance-chart" bordered={false}>
            <Area
              data={performanceData}
              xField="time"
              yField="cpu"
              smooth
              color="#1890ff"
              height={200}
              animation={{ appear: { animation: 'path-in', duration: 1000 } }}
            />
          </Card>

          {/* Department Status Grid */}
          <Card title="Department Status" className="glass-panel department-grid" bordered={false}>
            <Row gutter={[16, 16]}>
              {departments.map((dept) => (
                <Col span={8} key={dept.id}>
                  <motion.div
                    className={`department-card ${dept.status}`}
                    onClick={() => handleDepartmentClick(dept.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="department-header">
                      <Avatar style={{ backgroundColor: dept.color }} size="large">
                        {dept.icon}
                      </Avatar>
                      <div className="department-info">
                        <Text strong style={{ color: '#fff' }}>{dept.name}</Text>
                        <div className="status-indicator">
                          <Badge 
                            status={dept.status === 'online' ? 'success' : dept.status === 'maintenance' ? 'warning' : 'error'}
                            text={dept.status}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="department-metrics">
                      <Progress 
                        percent={dept.health} 
                        size="small" 
                        strokeColor={dept.color}
                        showInfo={false}
                      />
                      <div className="metrics-row">
                        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>Health: {dept.health}%</Text>
                        {dept.alerts > 0 && (
                          <Text style={{ color: '#f5222d' }}>Alerts: {dept.alerts}</Text>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Recent Alerts */}
          <Card title="Recent Alerts" className="glass-panel alerts-timeline" bordered={false}>
            <Timeline>
              <Timeline.Item color="red" dot={<AlertOutlined />}>
                <Text style={{ color: '#fff' }}>High memory usage detected in Payment service</Text>
                <br />
                <Text type="secondary">2 minutes ago</Text>
              </Timeline.Item>
              <Timeline.Item color="orange" dot={<ExclamationCircleOutlined />}>
                <Text style={{ color: '#fff' }}>Database connection pool reaching limit</Text>
                <br />
                <Text type="secondary">5 minutes ago</Text>
              </Timeline.Item>
              <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                <Text style={{ color: '#fff' }}>System backup completed successfully</Text>
                <br />
                <Text type="secondary">15 minutes ago</Text>
              </Timeline.Item>
            </Timeline>
          </Card>
        </div>

        {/* Right Panel - System Metrics */}
        <div className="cockpit-right-panel">
          <Card title="System Metrics" className="glass-panel" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {systemMetrics.map((metric) => (
                <div key={metric.id} className="metric-card">
                  <div className="metric-header">
                    <Text strong style={{ color: '#fff' }}>{metric.name}</Text>
                    <Badge 
                      status={metric.status === 'healthy' ? 'success' : metric.status === 'warning' ? 'warning' : 'error'}
                    />
                  </div>
                  
                  <div className="metric-value">
                    <Statistic
                      value={metric.value}
                      suffix={metric.unit}
                      valueStyle={{ 
                        color: getStatusColor(metric.status),
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}
                    />
                  </div>
                  
                  <Progress 
                    percent={(metric.value / metric.threshold) * 100} 
                    size="small" 
                    strokeColor={getStatusColor(metric.status)}
                    showInfo={false}
                  />
                </div>
              ))}
            </Space>
          </Card>

          {/* System Information */}
          <Card title="System Info" className="glass-panel" bordered={false} style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div className="info-item">
                <CloudServerOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <Text style={{ color: '#fff' }}>Kubernetes v1.28.0</Text>
              </div>
              <div className="info-item">
                <HddOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                <Text style={{ color: '#fff' }}>Storage: 2.4TB / 5TB</Text>
              </div>
              <div className="info-item">
                <MemoryStickOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                <Text style={{ color: '#fff' }}>Memory: 128GB / 256GB</Text>
              </div>
              <div className="info-item">
                <GlobalOutlined style={{ color: '#13c2c2', marginRight: 8 }} />
                <Text style={{ color: '#fff' }}>Region: US-East-1</Text>
              </div>
            </Space>
          </Card>
        </div>
      </div>

      {/* AI Assistant Drawer */}
      <Drawer
        title="AI System Assistant"
        placement="right"
        onClose={() => setAiAssistantOpen(false)}
        open={aiAssistantOpen}
        width={400}
        className="ai-assistant-drawer"
      >
        <div className="ai-assistant-content">
          <div className="ai-status">
            <Avatar size="large" style={{ backgroundColor: '#13c2c2' }}>
              <RobotOutlined />
            </Avatar>
            <div style={{ marginLeft: 16 }}>
              <Title level={4} style={{ margin: 0, color: '#000' }}>AI Core Assistant</Title>
              <Text style={{ color: '#52c41a' }}>● Online and Ready</Text>
            </div>
          </div>
          
          <div style={{ marginTop: 24 }}>
            <Title level={5} style={{ color: '#000' }}>System Recommendations</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Memory Optimization"
                description="Consider scaling Payment service pods to handle increased load"
                type="warning"
                showIcon
              />
              <Alert
                message="Performance Boost"
                description="Database query optimization could improve response time by 30%"
                type="info"
                showIcon
              />
              <Alert
                message="Security Update"
                description="New security patches available for Kubernetes cluster"
                type="success"
                showIcon
              />
            </Space>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default CockpitDashboard;