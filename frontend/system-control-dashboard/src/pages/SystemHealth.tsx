import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Button, Space, Typography, Badge, Alert, Statistic, Table, Tag } from 'antd';
import { 
  ArrowLeftOutlined,
  HeartOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ApiOutlined,
  MonitorOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Line, Gauge } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const SystemHealth: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const healthMetrics = [
    { name: 'Overall System Health', value: 94, status: 'healthy', color: '#52c41a' },
    { name: 'Database Performance', value: 87, status: 'warning', color: '#fa8c16' },
    { name: 'API Response Time', value: 96, status: 'healthy', color: '#52c41a' },
    { name: 'Memory Usage', value: 73, status: 'healthy', color: '#52c41a' },
    { name: 'CPU Utilization', value: 68, status: 'healthy', color: '#52c41a' },
    { name: 'Network Latency', value: 91, status: 'healthy', color: '#52c41a' }
  ];

  const serviceStatus = [
    { key: '1', service: 'Authentication Service', status: 'healthy', uptime: '99.9%', response: '45ms', instances: 3 },
    { key: '2', service: 'Payment Service', status: 'warning', uptime: '98.7%', response: '120ms', instances: 2 },
    { key: '3', service: 'Listing Service', status: 'maintenance', uptime: '0%', response: 'N/A', instances: 0 },
    { key: '4', service: 'Notification Service', status: 'healthy', uptime: '99.5%', response: '67ms', instances: 4 },
    { key: '5', service: 'AI Core Service', status: 'healthy', uptime: '99.8%', response: '89ms', instances: 2 },
    { key: '6', service: 'Auction Service', status: 'healthy', uptime: '99.2%', response: '78ms', instances: 3 }
  ];

  const columns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (text: string) => <Text style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : status === 'maintenance' ? 'processing' : 'error';
        const text = status === 'healthy' ? 'Healthy' : status === 'warning' ? 'Warning' : status === 'maintenance' ? 'Maintenance' : 'Error';
        return <Badge status={color} text={text} />;
      }
    },
    {
      title: 'Uptime',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (text: string) => <Text style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Response Time',
      dataIndex: 'response',
      key: 'response',
      render: (text: string) => <Text style={{ color: '#fff' }}>{text}</Text>
    },
    {
      title: 'Instances',
      dataIndex: 'instances',
      key: 'instances',
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'red'}>
          {count} {count === 1 ? 'instance' : 'instances'}
        </Tag>
      )
    }
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
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
            <HeartOutlined />
            System Health Monitor
          </Title>
        </div>
        
        <div className="header-right">
          <Button 
            type="primary" 
            icon={<SyncOutlined spin={loading} />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="cockpit-content">
        {/* Health Overview */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message="System Status: Operational with Minor Issues"
              description="All critical services are running. Payment service experiencing elevated response times."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </Col>
        </Row>

        {/* Health Metrics */}
        <Row gutter={[16, 16]}>
          {healthMetrics.map((metric, index) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={index}>
              <Card className="glass-panel" bordered={false}>
                <div style={{ textAlign: 'center' }}>
                  <Gauge
                    percent={metric.value / 100}
                    range={{ color: metric.color }}
                    height={120}
                    indicator={{
                      pointer: { style: { stroke: metric.color } },
                      pin: { style: { stroke: metric.color } }
                    }}
                    statistic={{
                      content: {
                        style: { fontSize: '16px', color: '#fff' },
                        formatter: () => `${metric.value}%`
                      }
                    }}
                  />
                  <Title level={5} style={{ color: '#fff', marginTop: 8, marginBottom: 0 }}>
                    {metric.name}
                  </Title>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Service Status Table */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Service Status" className="glass-panel" bordered={false}>
              <Table
                columns={columns}
                dataSource={serviceStatus}
                pagination={false}
                style={{ 
                  background: 'transparent',
                }}
                className="health-table"
              />
            </Card>
          </Col>
        </Row>

        {/* System Resources */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Resource Utilization" className="glass-panel" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#fff' }}>CPU Usage</Text>
                    <Text style={{ color: '#fff' }}>68%</Text>
                  </div>
                  <Progress percent={68} strokeColor="#52c41a" />
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#fff' }}>Memory Usage</Text>
                    <Text style={{ color: '#fff' }}>73%</Text>
                  </div>
                  <Progress percent={73} strokeColor="#fa8c16" />
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#fff' }}>Disk Usage</Text>
                    <Text style={{ color: '#fff' }}>45%</Text>
                  </div>
                  <Progress percent={45} strokeColor="#52c41a" />
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#fff' }}>Network I/O</Text>
                    <Text style={{ color: '#fff' }}>34%</Text>
                  </div>
                  <Progress percent={34} strokeColor="#1890ff" />
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Infrastructure Status" className="glass-panel" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div className="status-item">
                  <DatabaseOutlined style={{ color: '#52c41a', fontSize: 20, marginRight: 12 }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Database Cluster</Text>
                    <br />
                    <Badge status="success" text="3 nodes healthy" />
                  </div>
                </div>
                
                <div className="status-item">
                  <CloudServerOutlined style={{ color: '#52c41a', fontSize: 20, marginRight: 12 }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Kubernetes Cluster</Text>
                    <br />
                    <Badge status="success" text="12 nodes ready" />
                  </div>
                </div>
                
                <div className="status-item">
                  <ApiOutlined style={{ color: '#fa8c16', fontSize: 20, marginRight: 12 }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>API Gateway</Text>
                    <br />
                    <Badge status="warning" text="High latency detected" />
                  </div>
                </div>
                
                <div className="status-item">
                  <MonitorOutlined style={{ color: '#52c41a', fontSize: 20, marginRight: 12 }} />
                  <div>
                    <Text strong style={{ color: '#fff' }}>Monitoring Stack</Text>
                    <br />
                    <Badge status="success" text="All metrics collecting" />
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Recent Health Events */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Recent Health Events" className="glass-panel" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="health-event">
                  <WarningOutlined style={{ color: '#fa8c16', marginRight: 12 }} />
                  <div>
                    <Text style={{ color: '#fff' }}>Payment service response time increased to 120ms</Text>
                    <br />
                    <Text type="secondary">5 minutes ago</Text>
                  </div>
                </div>
                
                <div className="health-event">
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />
                  <div>
                    <Text style={{ color: '#fff' }}>Database connection pool optimized</Text>
                    <br />
                    <Text type="secondary">15 minutes ago</Text>
                  </div>
                </div>
                
                <div className="health-event">
                  <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 12 }} />
                  <div>
                    <Text style={{ color: '#fff' }}>Memory usage spike detected in AI Core service</Text>
                    <br />
                    <Text type="secondary">32 minutes ago</Text>
                  </div>
                </div>
                
                <div className="health-event">
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />
                  <div>
                    <Text style={{ color: '#fff' }}>System backup completed successfully</Text>
                    <br />
                    <Text type="secondary">1 hour ago</Text>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx>{`
        .health-table .ant-table {
          background: transparent !important;
        }
        
        .health-table .ant-table-thead > tr > th {
          background: rgba(255, 255, 255, 0.1) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
        }
        
        .health-table .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        
        .health-table .ant-table-tbody > tr:hover > td {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .status-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .status-item:last-child {
          border-bottom: none;
        }
        
        .health-event {
          display: flex;
          align-items: flex-start;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .health-event:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default SystemHealth;