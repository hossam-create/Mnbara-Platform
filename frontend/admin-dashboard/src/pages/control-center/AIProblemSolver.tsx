import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Alert, Button, Space, Typography, Timeline, Tag, Progress, Modal, Form, Input, Select, Table, List, Avatar, Badge, Tooltip, Drawer, Spin, Empty, Divider, Statistic, Rate, Tabs, Steps, Result, message } from 'antd';
import { 
  RobotOutlined, 
  BugOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ToolOutlined,
  BulbOutlined,
  TargetOutlined,
  ExperimentOutlined,
  CodeOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SecurityScanOutlined,
  MonitorOutlined,
  AlertOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  LoadingOutlined,
  ThunderboltOutlined,
  FireOutlined,
  ShieldOutlined,
  HeartOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SaveOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  AreaChartOutlined,
  HeatMapOutlined,
  RadarChartOutlined,
  ScatterChartOutlined,
  StockOutlined,
  FundOutlined,
  DashboardOutlined,
  ControlOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
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
  WifiOutlined,
  GlobalOutlined,
  CompassOutlined,
  AimOutlined,
  ZoomInOutlined,
  NotificationOutlined,
  MessageOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  HistoryOutlined,
  AuditOutlined,
  BuildOutlined,
  WrenchOutlined,
  RocketOutlined,
  DashboardOutlined as DashboardIcon
} from '@ant-design/icons';
import { Line, Area, Bar, Pie, Radar, Scatter, Heatmap } from '@ant-design/plots';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIAnalytics } from '../../hooks/useAIAnalytics';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { useRealTimeMonitoring } from '../../hooks/useRealTimeMonitoring';
import './AIProblemSolver.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

interface Problem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'diagnosing' | 'resolving' | 'resolved' | 'closed';
  category: string;
  department: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  estimatedResolution?: string;
  actualResolution?: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  symptoms: string[];
  rootCause?: string;
  aiConfidence: number;
  aiSolution?: string;
  humanSolution?: string;
  implementationSteps: string[];
  verificationSteps: string[];
  preventionSteps: string[];
  relatedProblems: string[];
  metrics: {
    affectedUsers: number;
    downtime: number;
    financialImpact: number;
    customerSatisfaction: number;
  };
  tags: string[];
  attachments: string[];
  comments: Comment[];
  history: HistoryEntry[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'system' | 'ai' | 'human';
}

interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  author: string;
}

interface AIAnalysis {
  problemId: string;
  analysis: {
    rootCause: string;
    confidence: number;
    severity: string;
    impact: string;
    urgency: string;
    suggestedSolution: string;
    implementationSteps: string[];
    estimatedTime: string;
    resources: string[];
    risks: string[];
    alternatives: string[];
  };
  patterns: {
    similarProblems: Problem[];
    frequency: number;
    trends: string[];
    correlations: string[];
  };
  predictions: {
    likelihoodOfRecurrence: number;
    timeToNextOccurrence: string;
    potentialImpact: string;
    preventiveActions: string[];
  };
}

interface UseAIProblemSolverReturn {
  problems: Problem[];
  aiAnalyses: AIAnalysis[];
  createProblem: (problem: Partial<Problem>) => Promise<Problem | null>;
  updateProblem: (id: string, updates: Partial<Problem>) => Promise<Problem | null>;
  analyzeProblem: (id: string) => Promise<AIAnalysis | null>;
  implementSolution: (id: string, solution: string) => Promise<boolean>;
  verifySolution: (id: string) => Promise<boolean>;
  isAnalyzing: boolean;
  error: string | null;
}

const AIProblemSolver: React.FC = () => {
  const [activeTab, setActiveTab] = useState('problems');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [solutionModalOpen, setSolutionModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState({ severity: '', status: '', department: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [searchTerm, setSearchTerm] = useState('');

  const { aiInsights, generateInsight, generateRecommendation } = useAIAnalytics();
  const { systemHealth } = useSystemHealth();
  const { monitoringData } = useRealTimeMonitoring();

  // Mock problems data
  const [problems, setProblems] = useState<Problem[]>([
    {
      id: '1',
      title: 'High latency in payment processing',
      description: 'Payment service experiencing 2x normal response time, causing checkout delays',
      severity: 'high',
      status: 'investigating',
      category: 'Performance',
      department: 'payment',
      assignedTo: 'AI Assistant',
      createdAt: '2024-01-20T10:30:00Z',
      updatedAt: '2024-01-20T11:15:00Z',
      estimatedResolution: '2024-01-20T14:00:00Z',
      impact: 'high',
      urgency: 'high',
      symptoms: ['Response time increased from 150ms to 300ms', 'Checkout completion rate dropped by 15%', 'Customer complaints increased'],
      aiConfidence: 0.92,
      aiSolution: 'Scale payment service pods and optimize database queries. Implement connection pooling and add caching layer.',
      implementationSteps: [
        'Scale payment service to 3 additional pods',
        'Optimize slow database queries identified in EXPLAIN ANALYZE',
        'Implement Redis caching for frequently accessed payment data',
        'Add connection pooling to database connections',
        'Monitor performance after implementation'
      ],
      verificationSteps: [
        'Verify response time is below 200ms',
        'Check checkout completion rate returns to normal',
        'Monitor error rates remain below 1%',
        'Test load with increased traffic'
      ],
      preventionSteps: [
        'Implement auto-scaling based on response time metrics',
        'Add database query performance monitoring',
        'Set up alerts for response time thresholds',
        'Regular performance testing and optimization'
      ],
      relatedProblems: ['2', '5'],
      metrics: {
        affectedUsers: 1250,
        downtime: 0,
        financialImpact: 5000,
        customerSatisfaction: 65
      },
      tags: ['performance', 'payment', 'latency', 'critical'],
      attachments: [],
      comments: [
        {
          id: '1',
          author: 'AI Assistant',
          content: 'Problem detected through anomaly detection in payment service metrics',
          timestamp: '2024-01-20T10:30:00Z',
          type: 'ai'
        },
        {
          id: '2',
          author: 'System',
          content: 'Auto-scaling triggered for payment service',
          timestamp: '2024-01-20T10:45:00Z',
          type: 'system'
        }
      ],
      history: [
        {
          id: '1',
          action: 'created',
          description: 'Problem automatically created by AI monitoring system',
          timestamp: '2024-01-20T10:30:00Z',
          author: 'AI Assistant'
        },
        {
          id: '2',
          action: 'assigned',
          description: 'Problem assigned to AI Assistant for investigation',
          timestamp: '2024-01-20T10:35:00Z',
          author: 'System'
        }
      ]
    },
    {
      id: '2',
      title: 'Memory leak in authentication service',
      description: 'Gradual memory increase detected in auth-service, requiring frequent restarts',
      severity: 'medium',
      status: 'diagnosing',
      category: 'Resource',
      department: 'auth',
      assignedTo: 'DevOps Team',
      createdAt: '2024-01-20T09:15:00Z',
      updatedAt: '2024-01-20T10:45:00Z',
      estimatedResolution: '2024-01-20T16:00:00Z',
      impact: 'medium',
      urgency: 'medium',
      symptoms: ['Memory usage increases by 2MB per minute', 'Service restarts every 4 hours', 'Login failures during restart periods'],
      aiConfidence: 0.87,
      aiSolution: 'Identify and fix memory leak in session management. Implement proper cleanup and monitoring.',
      implementationSteps: [
        'Analyze heap dumps to identify memory leak source',
        'Fix session cleanup in authentication middleware',
        'Implement memory usage monitoring and alerts',
        'Deploy hotfix to production',
        'Monitor memory usage patterns'
      ],
      verificationSteps: [
        'Verify memory usage stabilizes over time',
        'Check service no longer requires frequent restarts',
        'Monitor login success rates during peak hours',
        'Validate session cleanup is working properly'
      ],
      preventionSteps: [
        'Implement automated memory leak detection',
        'Add regular memory usage profiling',
        'Set up alerts for memory usage thresholds',
        'Regular code reviews for memory management'
      ],
      relatedProblems: ['1'],
      metrics: {
        affectedUsers: 890,
        downtime: 45,
        financialImpact: 2000,
        customerSatisfaction: 78
      },
      tags: ['memory', 'leak', 'auth', 'resource'],
      attachments: [],
      comments: [],
      history: []
    },
    {
      id: '3',
      title: 'Database connection pool exhaustion',
      description: 'Database connection pool reaching maximum capacity, causing connection timeouts',
      severity: 'critical',
      status: 'resolving',
      category: 'Database',
      department: 'shared',
      assignedTo: 'Database Team',
      createdAt: '2024-01-20T08:00:00Z',
      updatedAt: '2024-01-20T12:30:00Z',
      estimatedResolution: '2024-01-20T13:30:00Z',
      impact: 'critical',
      urgency: 'critical',
      symptoms: ['Database connection timeouts', 'Multiple services failing', 'High error rates across platform'],
      aiConfidence: 0.95,
      aiSolution: 'Increase connection pool size and optimize query performance. Implement connection retry logic.',
      implementationSteps: [
        'Increase database connection pool size by 50%',
        'Identify and optimize long-running queries',
        'Implement connection retry and circuit breaker patterns',
        'Add database connection monitoring',
        'Scale database resources if needed'
      ],
      verificationSteps: [
        'Verify connection pool usage stays below 80%',
        'Check connection timeouts are eliminated',
        'Monitor overall system error rates',
        'Test under peak load conditions'
      ],
      preventionSteps: [
        'Implement proactive connection pool monitoring',
        'Set up automated scaling for database resources',
        'Regular query performance optimization',
        'Implement database load testing'
      ],
      relatedProblems: [],
      metrics: {
        affectedUsers: 3450,
        downtime: 120,
        financialImpact: 15000,
        customerSatisfaction: 45
      },
      tags: ['database', 'connection', 'critical', 'pool'],
      attachments: [],
      comments: [],
      history: []
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return '#52c41a';
      case 'resolving':
      case 'diagnosing':
        return '#1890ff';
      case 'investigating':
        return '#722ed1';
      case 'open':
        return '#fa8c16';
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

  const analyzeProblem = useCallback(async (problemId: string) => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analysis: AIAnalysis = {
        problemId,
        analysis: {
          rootCause: 'Database connection pool not properly configured for high traffic scenarios',
          confidence: 0.92,
          severity: 'critical',
          impact: 'High - affecting multiple services and user experience',
          urgency: 'critical',
          suggestedSolution: 'Increase connection pool size, implement connection retry logic, and optimize database queries',
          implementationSteps: [
            'Configure connection pool to handle 2x current peak load',
            'Implement exponential backoff retry mechanism',
            'Add connection timeout and retry policies',
            'Optimize slow queries identified in monitoring',
            'Implement circuit breaker pattern for database calls'
          ],
          estimatedTime: '2-3 hours',
          resources: ['Database Administrator', 'DevOps Engineer', 'Backend Developer'],
          risks: ['Temporary service disruption during configuration changes', 'Potential data consistency issues'],
          alternatives: ['Scale database vertically', 'Implement read replicas', 'Use connection pooling middleware']
        },
        patterns: {
          similarProblems: problems.filter(p => p.category === 'Database'),
          frequency: 3,
          trends: ['Increasing frequency during peak hours', 'Correlation with user traffic spikes'],
          correlations: ['High CPU usage on database server', 'Increased query execution times']
        },
        predictions: {
          likelihoodOfRecurrence: 0.75,
          timeToNextOccurrence: '2-3 days during peak traffic',
          potentialImpact: 'Medium if preventive measures implemented',
          preventiveActions: [
            'Implement proactive connection pool monitoring',
            'Set up automated scaling triggers',
            'Regular database performance tuning',
            'Implement query caching strategies'
          ]
        }
      };

      setAiAnalysis(analysis);
      setAnalysisModalOpen(true);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [problems]);

  const renderProblemsTab = () => (
    <div className="problems-tab">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card className="problems-header" bordered={false}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Title level={3} style={{ margin: 0 }}>Active Problems</Title>
                  <Badge count={problems.filter(p => p.status !== 'resolved' && p.status !== 'closed').length} />
                </Space>
              </Col>
              <Col>
                <Space>
                  <Input
                    placeholder="Search problems..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Select
                    placeholder="Filter by severity"
                    value={filter.severity}
                    onChange={(value) => setFilter(prev => ({ ...prev, severity: value }))}
                    style={{ width: 150 }}
                  >
                    <Option value="">All Severities</Option>
                    <Option value="critical">Critical</Option>
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </Select>
                  <Select
                    placeholder="Filter by status"
                    value={filter.status}
                    onChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
                    style={{ width: 150 }}
                  >
                    <Option value="">All Statuses</Option>
                    <Option value="open">Open</Option>
                    <Option value="investigating">Investigating</Option>
                    <Option value="diagnosing">Diagnosing</Option>
                    <Option value="resolving">Resolving</Option>
                    <Option value="resolved">Resolved</Option>
                    <Option value="closed">Closed</Option>
                  </Select>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                    Create Problem
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {problems
          .filter(problem => {
            const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                problem.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSeverity = !filter.severity || problem.severity === filter.severity;
            const matchesStatus = !filter.status || problem.status === filter.status;
            return matchesSearch && matchesSeverity && matchesStatus;
          })
          .map((problem) => (
            <Col span={8} key={problem.id}>
              <motion.div
                className="problem-card"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedProblem(problem);
                  setDetailDrawerOpen(true);
                }}
              >
                <Card
                  className={`problem-card-content ${problem.severity}`}
                  bordered={false}
                  actions={[
                    <Button key="analyze" icon={<ExperimentOutlined />} onClick={(e) => {
                      e.stopPropagation();
                      analyzeProblem(problem.id);
                    }}>
                      AI Analyze
                    </Button>,
                    <Button key="solve" icon={<ToolOutlined />} onClick={(e) => {
                      e.stopPropagation();
                      setSolutionModalOpen(true);
                    }}>
                      Solve
                    </Button>
                  ]}
                >
                  <div className="problem-header">
                    <div className="problem-title">
                      <Title level={4}>{problem.title}</Title>
                      <Space>
                        <Tag color={getSeverityColor(problem.severity)}>{problem.severity}</Tag>
                        <Tag color={getStatusColor(problem.status)}>{problem.status}</Tag>
                      </Space>
                    </div>
                    <div className="problem-meta">
                      <Text type="secondary">{problem.department} • {problem.category}</Text>
                      <br />
                      <Text type="secondary">Created {new Date(problem.createdAt).toLocaleString()}</Text>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div className="problem-description">
                    <Paragraph ellipsis={{ rows: 2 }}>{problem.description}</Paragraph>
                  </div>
                  
                  <div className="problem-metrics">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title="Affected Users"
                          value={problem.metrics.affectedUsers}
                          prefix={<UserOutlined />}
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Downtime"
                          value={problem.metrics.downtime}
                          suffix="min"
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Impact"
                          value={problem.metrics.financialImpact}
                          prefix="$"
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </Col>
                    </Row>
                  </div>
                  
                  <div className="problem-ai-confidence">
                    <Text strong>AI Confidence: </Text>
                    <Progress percent={problem.aiConfidence * 100} size="small" showInfo={false} />
                    <Text>{(problem.aiConfidence * 100).toFixed(0)}%</Text>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
      </Row>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="analytics-tab">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Problem Trends" bordered={false}>
            <Area
              data={[
                { date: '2024-01-15', problems: 5, resolved: 3 },
                { date: '2024-01-16', problems: 8, resolved: 6 },
                { date: '2024-01-17', problems: 12, resolved: 8 },
                { date: '2024-01-18', problems: 7, resolved: 9 },
                { date: '2024-01-19', problems: 15, resolved: 11 },
                { date: '2024-01-20', problems: 18, resolved: 14 }
              ]}
              xField="date"
              yField="problems"
              smooth
              color="#1890ff"
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Problem Distribution" bordered={false}>
            <Pie
              data={[
                { type: 'Performance', value: 35 },
                { type: 'Database', value: 25 },
                { type: 'Security', value: 15 },
                { type: 'Resource', value: 20 },
                { type: 'Network', value: 5 }
              ]}
              angleField="value"
              colorField="type"
              color={['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1']}
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="AI Performance Metrics" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title="AI Accuracy"
                  value={89}
                  suffix="%"
                  prefix={<TargetOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Avg Resolution Time"
                  value={2.5}
                  suffix="hours"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Problems Prevented"
                  value={47}
                  prefix={<ShieldOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Cost Savings"
                  value={125000}
                  prefix="$"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderSolutionsTab = () => (
    <div className="solutions-tab">
      <Card title="AI-Generated Solutions" bordered={false}>
        <Timeline>
          {problems
            .filter(p => p.aiSolution)
            .map((problem) => (
              <Timeline.Item
                key={problem.id}
                color={getSeverityColor(problem.severity)}
                dot={<BulbOutlined />}
              >
                <div className="solution-item">
                  <Title level={4}>{problem.title}</Title>
                  <Paragraph>{problem.aiSolution}</Paragraph>
                  <div className="solution-steps">
                    <Title level={5}>Implementation Steps:</Title>
                    <ol>
                      {problem.implementationSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="solution-actions">
                    <Space>
                      <Button type="primary" icon={<PlayCircleOutlined />}>
                        Implement Solution
                      </Button>
                      <Button icon={<EditOutlined />}>
                        Modify Solution
                      </Button>
                      <Button icon={<ShareAltOutlined />}>
                        Share Solution
                      </Button>
                    </Space>
                  </div>
                </div>
              </Timeline.Item>
            ))}
        </Timeline>
      </Card>
    </div>
  );

  return (
    <div className="ai-problem-solver">
      <div className="solver-header">
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Avatar size="large" style={{ backgroundColor: '#13c2c2' }}>
                <RobotOutlined />
              </Avatar>
              <div>
                <Title level={2} style={{ margin: 0 }}>AI Problem Solver</Title>
                <Text type="secondary">Intelligent problem detection, analysis, and resolution</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge count={problems.filter(p => p.status === 'open').length}>
                <Button icon={<AlertOutlined />}>Open Problems</Button>
              </Badge>
              <Button icon={<SyncOutlined />} onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <div className="solver-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Problems" key="problems">
            {renderProblemsTab()}
          </TabPane>
          <TabPane tab="Analytics" key="analytics">
            {renderAnalyticsTab()}
          </TabPane>
          <TabPane tab="Solutions" key="solutions">
            {renderSolutionsTab()}
          </TabPane>
        </Tabs>
      </div>

      {/* Problem Detail Drawer */}
      <Drawer
        title={selectedProblem?.title}
        placement="right"
        onClose={() => setDetailDrawerOpen(false)}
        open={detailDrawerOpen}
        width={600}
      >
        {selectedProblem && (
          <div className="problem-detail">
            <div className="problem-status">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Status: </Text>
                  <Tag color={getStatusColor(selectedProblem.status)}>{selectedProblem.status}</Tag>
                </div>
                <div>
                  <Text strong>Severity: </Text>
                  <Tag color={getSeverityColor(selectedProblem.severity)}>{selectedProblem.severity}</Tag>
                </div>
                <div>
                  <Text strong>Department: </Text>
                  <Tag>{selectedProblem.department}</Tag>
                </div>
                <div>
                  <Text strong>AI Confidence: </Text>
                  <Progress percent={selectedProblem.aiConfidence * 100} size="small" />
                </div>
              </Space>
            </div>

            <Divider />

            <div className="problem-description">
              <Title level={4}>Description</Title>
              <Paragraph>{selectedProblem.description}</Paragraph>
            </div>

            <Divider />

            <div className="problem-symptoms">
              <Title level={4}>Symptoms</Title>
              <List
                dataSource={selectedProblem.symptoms}
                renderItem={(symptom) => (
                  <List.Item>
                    <Text>• {symptom}</Text>
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            <div className="problem-metrics">
              <Title level={4}>Impact Metrics</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Affected Users" value={selectedProblem.metrics.affectedUsers} />
                </Col>
                <Col span={12}>
                  <Statistic title="Downtime (min)" value={selectedProblem.metrics.downtime} />
                </Col>
                <Col span={12}>
                  <Statistic title="Financial Impact" value={selectedProblem.metrics.financialImpact} prefix="$" />
                </Col>
                <Col span={12}>
                  <Statistic title="Customer Satisfaction" value={selectedProblem.metrics.customerSatisfaction} suffix="/100" />
                </Col>
              </Row>
            </div>

            <Divider />

            <div className="problem-actions">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" icon={<ExperimentOutlined />} block onClick={() => analyzeProblem(selectedProblem.id)}>
                  AI Analysis
                </Button>
                <Button icon={<ToolOutlined />} block>
                  Implement Solution
                </Button>
                <Button icon={<EditOutlined />} block>
                  Edit Problem
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* AI Analysis Modal */}
      <Modal
        title="AI Analysis"
        open={analysisModalOpen}
        onCancel={() => setAnalysisModalOpen(false)}
        footer={null}
        width={800}
      >
        {isAnalyzing ? (
          <div className="analysis-loading">
            <Spin size="large" />
            <Title level={4}>AI is analyzing the problem...</Title>
            <Text>This may take a few moments</Text>
          </div>
        ) : aiAnalysis ? (
          <div className="analysis-result">
            <Steps current={-1} direction="vertical">
              <Step
                title="Root Cause Analysis"
                description={aiAnalysis.analysis.rootCause}
                icon={<BugOutlined />}
              />
              <Step
                title="Suggested Solution"
                description={aiAnalysis.analysis.suggestedSolution}
                icon={<BulbOutlined />}
              />
              <Step
                title="Implementation Steps"
                description={
                  <ul>
                    {aiAnalysis.analysis.implementationSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                }
                icon={<ToolOutlined />}
              />
              <Step
                title="Estimated Time"
                description={aiAnalysis.analysis.estimatedTime}
                icon={<ClockCircleOutlined />}
              />
            </Steps>
            
            <Divider />
            
            <div className="analysis-confidence">
              <Title level={4}>AI Confidence: {(aiAnalysis.analysis.confidence * 100).toFixed(0)}%</Title>
              <Progress percent={aiAnalysis.analysis.confidence * 100} />
            </div>
            
            <div className="analysis-actions">
              <Space>
                <Button type="primary" icon={<PlayCircleOutlined />}>
                  Implement Solution
                </Button>
                <Button icon={<EditOutlined />}>
                  Modify Solution
                </Button>
                <Button icon={<SaveOutlined />}>
                  Save Analysis
                </Button>
              </Space>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Create Problem Modal */}
      <Modal
        title="Create New Problem"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Problem Title" required>
            <Input placeholder="Enter problem title" />
          </Form.Item>
          <Form.Item label="Description" required>
            <TextArea rows={4} placeholder="Describe the problem in detail" />
          </Form.Item>
          <Form.Item label="Severity" required>
            <Select placeholder="Select severity">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Department" required>
            <Select placeholder="Select department">
              <Option value="auth">Authentication</Option>
              <Option value="payment">Payment</Option>
              <Option value="auction">Auction</Option>
              <Option value="listing">Listing</Option>
              <Option value="notification">Notification</Option>
              <Option value="shared">Shared Services</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Category" required>
            <Select placeholder="Select category">
              <Option value="performance">Performance</Option>
              <Option value="security">Security</Option>
              <Option value="database">Database</Option>
              <Option value="resource">Resource</Option>
              <Option value="network">Network</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">Create Problem</Button>
              <Button onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AIProblemSolver;
