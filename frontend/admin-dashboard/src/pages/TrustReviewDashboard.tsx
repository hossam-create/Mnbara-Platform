import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography } from 'antd';
import { 
  UserOutlined, 
  SafetyOutlined, 
  ShoppingOutlined, 
  AuditOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseOutlined,
  EyeOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminService, KYCSubmission, Dispute } from '../services/admin.service';

const { Title } = Typography;

const TrustReviewDashboard = () => {
  const navigate = useNavigate();
  const [kycStats, setKycStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [disputeStats, setDisputeStats] = useState({ open: 0, resolved: 0, escalated: 0 });
  const [recentKyc, setRecentKyc] = useState<KYCSubmission[]>([]);
  const [recentDisputes, setRecentDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kycResponse, disputesResponse, kycSubmissions, recentDisputesResp] = await Promise.all([
        adminService.getKYCStats(),
        adminService.getDisputeStats(),
        adminService.getKYCSubmissions({ page: 1, limit: 5 }),
        adminService.getDisputes({ page: 1, limit: 5 })
      ]);
      
      setKycStats(kycResponse);
      setDisputeStats(disputesResponse);
      setRecentKyc(kycResponse.data || []);
      setRecentDisputes(recentDisputesResp.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const kycColumns = [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => `${user.fullName} (${user.email})`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'approved' ? 'success' : status === 'pending' ? 'processing' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: KYCSubmission) => (
        <Button 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/kyc-review/${record.id}`)}
        >
          Review
        </Button>
      )
    }
  ];

  const disputeColumns = [
    {
      title: 'Dispute ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Parties',
      key: 'parties',
      render: (record: Dispute) => `${record.buyerName} vs ${record.sellerName}`
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${amount.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'resolved' ? 'success' : status === 'open' ? 'processing' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: Dispute) => (
        <Button 
          size="small" 
          icon={<FileSearchOutlined />}
          onClick={() => navigate(`/dispute-detail/${record.id}`)}
        >
          Investigate
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Trust & Review Admin Panel</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending KYC"
              value={kycStats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              suffix={<Button type="link" onClick={() => navigate('/kyc')}>View All</Button>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved KYC"
              value={kycStats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Open Disputes"
              value={disputeStats.open}
              prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
              suffix={<Button type="link" onClick={() => navigate('/disputes')}>View All</Button>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Escalated Cases"
              value={disputeStats.escalated}
              prefix={<AuditOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="Recent KYC Submissions" 
            extra={<Button type="link" onClick={() => navigate('/kyc')}>Manage KYC</Button>}
          >
            <Table
              columns={kycColumns}
              dataSource={recentKyc}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            title="Recent Disputes" 
            extra={<Button type="link" onClick={() => navigate('/disputes')}>Manage Disputes</Button>}
          >
            <Table
              columns={disputeColumns}
              dataSource={recentDisputes}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card title="Quick Actions" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<SafetyOutlined />} onClick={() => navigate('/kyc')}>
                KYC Management
              </Button>
              <Button block icon={<ShoppingOutlined />} onClick={() => navigate('/disputes')}>
                Dispute Resolution
              </Button>
              <Button block icon={<AuditOutlined />} onClick={() => navigate('/audit')}>
                Audit Explorer
              </Button>
              <Button block icon={<FileSearchOutlined />} onClick={() => navigate('/guarantee-ledger')}>
                Guarantee Ledger
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="System Status" size="small">
            <Space direction="vertical">
              <div><Tag color="green">Operational</Tag> KYC Service</div>
              <div><Tag color="green">Operational</Tag> Dispute Service</div>
              <div><Tag color="green">Operational</Tag> Audit Service</div>
              <div><Tag color="green">Operational</Tag> Guarantee Service</div>
            </Space>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="Compliance" size="small">
            <Space direction="vertical">
              <div>Last Audit: {new Date().toLocaleDateString()}</div>
              <div>MFA Required: <Tag color="blue">Enabled</Tag></div>
              <div>Session Timeout: <Tag color="blue">15 min</Tag></div>
              <div>Audit Logging: <Tag color="green">Active</Tag></div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TrustReviewDashboard;