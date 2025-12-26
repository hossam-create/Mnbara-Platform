import React, { useState } from 'react';
import { Card, Row, Col, Button, Space, Typography, Badge, Alert, Timeline, Tag, Modal, Form, Input, Select, Progress, List, Avatar } from 'antd';
import { 
  ArrowLeftOutlined,
  RobotOutlined,
  BugOutlined,
  BulbOutlined,
  TargetOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SyncOutlined,
  AlertOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

interface Problem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'analyzing' | 'solving' | 'resolved';
  department: string;
  aiSolution?: string;
  progress: number;
  timestamp: string;
}

const AIProblemSolver: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [solutionModalVisible, setSolutionModalVisible] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const problems: Problem[] = [
    {
      id: '1',
      title: 'High Memory Usage in Payment Service',
      description: 'Payment service memory consumption has increased by 40% in the last hour',
      severity: 'high',
      status: 'analyzing',
      department: 'payment',
      aiSolution: 'Restart payment service pods and implement memory optimization patches',
      progress: 75,
      timestamp: '2 minutes ago'
    },
    {
      id: '2',
      title: 'Database Connection Pool Exhaustion',
      description: 'Connection pool reaching maximum capacity during peak hours',
      severity: 'critical',
      status: 'solving',
      department: 'database',
      aiSolution: 'Increase connection pool size and implement connection recycling',
      progress: 45,
      timestamp: '8 minutes ago'
    },
    {
      id: '3',
      title: 'API Gateway Latency Spike',
      description: 'Response times increased from 50ms to 200ms average',
      severity: 'medium',
      status: 'detected',
      department: 'api-gateway',
      progress: 0,
      timestamp: '15 minutes ago'
    },
    {
      id: '4',
      title: 'Elasticsearch Index Corruption',
      description: 'Search functionality degraded due to index corruption',
      severity: 'high',
      status: 'resolved',
      department: 'search',
      aiSolution: 'Rebuilt corrupted indices and implemented backup strategy',
      progress: 100,
      timestamp: '1 hour ago'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#52c41a';
      case 'medium': return '#fa8c16';
      case 'high': return '#fa541c';
      case 'critical': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'default';
      case 'analyzing': return 'processing';
      case 'solving': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const handleAnalyzeProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setAnalyzing(false);
      setSolutionModalVisible(true);
    }, 3000);
  };

  const handleImplementSolution = () => {
    setSolutionModalVisible(false);
    // Implement solution logic here
    Modal.success({
      title: 'Solution Implementation Started',
      content: 'AI solution is being implemented. You will be notified when complete.',
    });
  };

  return (
    <div className="cockpit-page">
      {/* Header */}
      <div className="cockpit-header">
        <div className="header-left">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/cockpit')}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', marginRight: 16 }}
          >
            Back to Cockpit
          </Button>
          <Title level={2} style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RobotOutlined />
            AI Problem Solver
          </Title>
        </div>
        
        <div className="header-right">
          <Space>
            <Button 
              type="primary" 
              icon={<ExperimentOutlined />}
              onClick={() => setAnalyzing(true)}
            >
              Run Full System Scan
            </Button>
          </Space>
        </div>
      </div>

      {/* Content */}
      <div className="cockpit-content">
        {/* AI Status */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message="AI Problem Solver Active"
              description="Continuously monitoring system for anomalies and performance issues. 4 problems detected, 1 resolved automatically."
              type="info"
              showIcon
              icon={<RobotOutlined />}
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>

        {/* Problem Overview */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Card className="glass-panel" bordered={false}>
              <div style={{ textAlign: 'center' }}>
                <Title level={1} style={{ color: '#f5222d', margin: 0 }}>3</Title>
                <Text style={{ color: '#fff' }}>Active Problems</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card className="glass-panel" bordered={false}>
              <div style={{ textAlign: 'center' }}>
                <Title level={1} style={{ color: '#fa8c16', margin: 0 }}>2</Title>
                <Text style={{ color: '#fff' }}>Being Analyzed</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card className="glass-panel" bordered={false}>
              <div style={{ textAlign: 'center' }}>
                <Title level={1} style={{ color: '#1890ff', margin: 0 }}>1</Title>
                <Text style={{ color: '#fff' }}>Solutions Ready</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card className="glass-panel" bordered={false}>
              <div style={{ textAlign: 'center' }}>
                <Title level={1} style={{ color: '#52c41a', margin: 0 }}>1</Title>
                <Text style={{ color: '#fff' }}>Resolved Today</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Problems List */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="Detected Problems" className="glass-panel" bordered={false}>
              <List
                dataSource={problems}
                renderItem={(problem) => (
                  <List.Item
                    className="problem-item"
                    actions={[
                      <Button 
                        key="analyze"
                        type="primary" 
                        size="small"
                        icon={<BulbOutlined />}
                        onClick={() => handleAnalyzeProblem(problem)}
                        disabled={problem.status === 'resolved'}
                      >
                        {problem.status === 'detected' ? 'Analyze' : 'View Solution'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: getSeverityColor(problem.severity) }}
                          icon={<BugOutlined />}
                        />
                      }
                      title={
                        <div>
                          <Text strong style={{ color: '#fff' }}>{problem.title}</Text>
                          <div style={{ marginTop: 4 }}>
                            <Tag color={getSeverityColor(problem.severity)}>
                              {problem.severity.toUpperCase()}
                            </Tag>
                            <Badge 
                              status={getStatusColor(problem.status)} 
                              text={problem.status.charAt(0).toUpperCase() + problem.status.slice(1)}
                            />
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {problem.description}
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {problem.department} • {problem.timestamp}
                          </Text>
                          {problem.progress > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <Progress 
                                percent={problem.progress} 
                                size="small" 
                                strokeColor={getSeverityColor(problem.severity)}
                              />
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="AI Analysis Timeline" className="glass-panel" bordered={false}>
              <Timeline>
                <Timeline.Item 
                  color="blue" 
                  dot={<RobotOutlined />}
                >
                  <Text style={{ color: '#fff' }}>AI scan initiated</Text>
                  <br />
                  <Text type="secondary">Just now</Text>
                </Timeline.Item>
                
                <Timeline.Item 
                  color="orange" 
                  dot={<ExclamationCircleOutlined />}
                >
                  <Text style={{ color: '#fff' }}>Memory leak detected in Payment service</Text>
                  <br />
                  <Text type="secondary">2 minutes ago</Text>
                </Timeline.Item>
                
                <Timeline.Item 
                  color="red" 
                  dot={<AlertOutlined />}
                >
                  <Text style={{ color: '#fff' }}>Critical: Database connection pool exhausted</Text>
                  <br />
                  <Text type="secondary">8 minutes ago</Text>
                </Timeline.Item>
                
                <Timeline.Item 
                  color="green" 
                  dot={<CheckCircleOutlined />}
                >
                  <Text style={{ color: '#fff' }}>Elasticsearch index corruption resolved</Text>
                  <br />
                  <Text type="secondary">1 hour ago</Text>
                </Timeline.Item>
                
                <Timeline.Item 
                  color="blue" 
                  dot={<TargetOutlined />}
                >
                  <Text style={{ color: '#fff' }}>Predictive analysis completed</Text>
                  <br />
                  <Text type="secondary">2 hours ago</Text>
                </Timeline.Item>
              </Timeline>
            </Card>

            {/* AI Recommendations */}
            <Card title="AI Recommendations" className="glass-panel" bordered={false} style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Proactive Scaling"
                  description="Consider scaling Payment service pods before peak hours (2 PM - 6 PM)"
                  type="info"
                  showIcon
                  icon={<BulbOutlined />}
                />
                
                <Alert
                  message="Database Optimization"
                  description="Query optimization could reduce response time by 35%"
                  type="success"
                  showIcon
                  icon={<TargetOutlined />}
                />
                
                <Alert
                  message="Security Update"
                  description="New security patches available for Kubernetes cluster"
                  type="warning"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      {/* AI Solution Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RobotOutlined style={{ color: '#1890ff' }} />
            AI Generated Solution
          </div>
        }
        open={solutionModalVisible}
        onCancel={() => setSolutionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSolutionModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="implement" type="primary" onClick={handleImplementSolution}>
            Implement Solution
          </Button>
        ]}
        width={600}
      >
        {selectedProblem && (
          <div>
            <Title level={4}>{selectedProblem.title}</Title>
            <Text>{selectedProblem.description}</Text>
            
            <div style={{ margin: '16px 0' }}>
              <Tag color={getSeverityColor(selectedProblem.severity)}>
                {selectedProblem.severity.toUpperCase()} PRIORITY
              </Tag>
              <Tag>{selectedProblem.department}</Tag>
            </div>

            {analyzing ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <SyncOutlined spin style={{ fontSize: '32px', color: '#1890ff' }} />
                <div style={{ marginTop: 16 }}>
                  <Text>AI is analyzing the problem...</Text>
                </div>
              </div>
            ) : (
              <div>
                <Title level={5}>Recommended Solution:</Title>
                <Alert
                  message={selectedProblem.aiSolution}
                  type="info"
                  showIcon
                  icon={<BulbOutlined />}
                />
                
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>Implementation Steps:</Title>
                  <ol>
                    <li>Scale down affected service instances</li>
                    <li>Apply memory optimization patches</li>
                    <li>Restart service with new configuration</li>
                    <li>Monitor performance for 30 minutes</li>
                    <li>Scale up to normal capacity</li>
                  </ol>
                </div>
                
                <div style={{ marginTop: 16 }}>
                  <Text strong>Estimated Resolution Time: </Text>
                  <Text>15-20 minutes</Text>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style jsx>{`
        .problem-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 8px;
        }
        
        .problem-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(24, 144, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default AIProblemSolver;