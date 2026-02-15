import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Alert, Spin, Button, Select, DatePicker, Space } from 'antd';
import { 
  GlobalOutlined, 
  SafetyOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { Line, Pie, Column } from '@ant-design/charts';
import moment from 'moment';
import './CountryDashboard.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface CountryStats {
  totalCountries: number;
  activeCountries: number;
  restrictedCountries: number;
  highRiskRoutes: number;
  totalComplianceLogs: number;
  complianceRate: number;
}

interface Country {
  code: string;
  name: string;
  nameAr: string;
  currency: string;
  isActive: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceStatus: 'approved' | 'restricted' | 'prohibited';
  rulesCount: number;
  lastUpdated: string;
}

interface ComplianceLog {
  id: string;
  productId: string;
  countryCode: string;
  ruleType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'passed' | 'failed' | 'warning';
  createdAt: string;
  description: string;
}

interface RouteValidation {
  originCountry: string;
  destinationCountry: string;
  riskScore: number;
  riskLevel: string;
  complianceStatus: string;
  validationCount: number;
}

const CountryDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CountryStats>({
    totalCountries: 0,
    activeCountries: 0,
    restrictedCountries: 0,
    highRiskRoutes: 0,
    totalComplianceLogs: 0,
    complianceRate: 0,
  });
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([]);
  const [routeValidations, setRouteValidations] = useState<RouteValidation[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [dateRange, setDateRange] = useState<any>([moment().subtract(30, 'days'), moment()]);
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');

  // Mock data for demonstration
  const mockStats: CountryStats = {
    totalCountries: 195,
    activeCountries: 180,
    restrictedCountries: 15,
    highRiskRoutes: 23,
    totalComplianceLogs: 1250,
    complianceRate: 94.5,
  };

  const mockCountries: Country[] = [
    {
      code: 'US',
      name: 'United States',
      nameAr: 'الولايات المتحدة',
      currency: 'USD',
      isActive: true,
      riskScore: 15,
      riskLevel: 'low',
      complianceStatus: 'approved',
      rulesCount: 5,
      lastUpdated: '2024-01-15T10:30:00Z',
    },
    {
      code: 'SA',
      name: 'Saudi Arabia',
      nameAr: 'السعودية',
      currency: 'SAR',
      isActive: true,
      riskScore: 25,
      riskLevel: 'low',
      complianceStatus: 'approved',
      rulesCount: 8,
      lastUpdated: '2024-01-14T15:45:00Z',
    },
    {
      code: 'IR',
      name: 'Iran',
      nameAr: 'إيران',
      currency: 'IRR',
      isActive: false,
      riskScore: 85,
      riskLevel: 'critical',
      complianceStatus: 'prohibited',
      rulesCount: 15,
      lastUpdated: '2024-01-13T09:20:00Z',
    },
    {
      code: 'CN',
      name: 'China',
      nameAr: 'الصين',
      currency: 'CNY',
      isActive: true,
      riskScore: 45,
      riskLevel: 'medium',
      complianceStatus: 'restricted',
      rulesCount: 12,
      lastUpdated: '2024-01-12T14:10:00Z',
    },
  ];

  const mockComplianceLogs: ComplianceLog[] = [
    {
      id: '1',
      productId: 'prod-123',
      countryCode: 'SA',
      ruleType: 'import',
      severity: 'high',
      status: 'passed',
      createdAt: '2024-01-15T12:30:00Z',
      description: 'Product complies with Saudi import regulations',
    },
    {
      id: '2',
      productId: 'prod-456',
      countryCode: 'IR',
      ruleType: 'restricted',
      severity: 'critical',
      status: 'failed',
      createdAt: '2024-01-15T11:15:00Z',
      description: 'Product contains restricted items for Iran',
    },
    {
      id: '3',
      productId: 'prod-789',
      countryCode: 'US',
      ruleType: 'customs',
      severity: 'medium',
      status: 'warning',
      createdAt: '2024-01-15T10:45:00Z',
      description: 'Customs declaration required for electronics',
    },
  ];

  const mockRouteValidations: RouteValidation[] = [
    {
      originCountry: 'US',
      destinationCountry: 'SA',
      riskScore: 25,
      riskLevel: 'low',
      complianceStatus: 'approved',
      validationCount: 156,
    },
    {
      originCountry: 'CN',
      destinationCountry: 'US',
      riskScore: 65,
      riskLevel: 'high',
      complianceStatus: 'restricted',
      validationCount: 89,
    },
    {
      originCountry: 'SA',
      destinationCountry: 'AE',
      riskScore: 15,
      riskLevel: 'low',
      complianceStatus: 'approved',
      validationCount: 234,
    },
  ];

  useEffect(() => {
    // Simulate API calls
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats(mockStats);
      setCountries(mockCountries);
      setComplianceLogs(mockComplianceLogs);
      setRouteValidations(mockRouteValidations);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'critical': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      default: return <GlobalOutlined />;
    }
  };

  const countryColumns = [
    {
      title: 'Country',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Country) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.nameAr}</div>
        </div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Risk Level',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (riskLevel: string) => (
        <Tag color={getRiskColor(riskLevel)}>{riskLevel.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          strokeColor={score < 30 ? '#52c41a' : score < 60 ? '#faad14' : '#ff4d4f'}
          format={() => `${score}%`}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'complianceStatus',
      key: 'complianceStatus',
      render: (status: string) => (
        <Tag color={status === 'approved' ? 'green' : status === 'restricted' ? 'orange' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Rules',
      dataIndex: 'rulesCount',
      key: 'rulesCount',
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
    },
  ];

  const complianceColumns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusIcon(status),
      width: 60,
    },
    {
      title: 'Product ID',
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: 'Country',
      dataIndex: 'countryCode',
      key: 'countryCode',
    },
    {
      title: 'Rule Type',
      dataIndex: 'ruleType',
      key: 'ruleType',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getRiskColor(severity)}>{severity.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => moment(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const routeColumns = [
    {
      title: 'Origin',
      dataIndex: 'originCountry',
      key: 'originCountry',
    },
    {
      title: 'Destination',
      dataIndex: 'destinationCountry',
      key: 'destinationCountry',
    },
    {
      title: 'Risk Level',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (riskLevel: string) => (
        <Tag color={getRiskColor(riskLevel)}>{riskLevel.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (score: number) => (
        <Progress 
          percent={score} 
          size="small" 
          strokeColor={score < 30 ? '#52c41a' : score < 60 ? '#faad14' : '#ff4d4f'}
          format={() => `${score}%`}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'complianceStatus',
      key: 'complianceStatus',
      render: (status: string) => (
        <Tag color={status === 'approved' ? 'green' : status === 'restricted' ? 'orange' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Validations',
      dataIndex: 'validationCount',
      key: 'validationCount',
    },
  ];

  const riskDistributionData = [
    { type: 'Low Risk', value: countries.filter(c => c.riskLevel === 'low').length },
    { type: 'Medium Risk', value: countries.filter(c => c.riskLevel === 'medium').length },
    { type: 'High Risk', value: countries.filter(c => c.riskLevel === 'high').length },
    { type: 'Critical Risk', value: countries.filter(c => c.riskLevel === 'critical').length },
  ];

  const complianceTrendData = [
    { date: '2024-01-01', compliance: 92 },
    { date: '2024-01-05', compliance: 94 },
    { date: '2024-01-10', compliance: 93 },
    { date: '2024-01-15', compliance: 94.5 },
  ];

  const pieConfig = {
    data: riskDistributionData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  const lineConfig = {
    data: complianceTrendData,
    xField: 'date',
    yField: 'compliance',
    smooth: true,
    color: '#52c41a',
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Loading Country Layer Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="country-dashboard">
      <div className="dashboard-header">
        <h1>
          <GlobalOutlined /> Country Layer Control Center
        </h1>
        <p>Monitor and manage country compliance, risk assessment, and trade route validation</p>
      </div>

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Countries"
              value={stats.totalCountries}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Active Countries"
              value={stats.activeCountries}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Restricted Countries"
              value={stats.restrictedCountries}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="High Risk Routes"
              value={stats.highRiskRoutes}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Compliance Rate"
              value={stats.complianceRate}
              precision={1}
              suffix="%"
              prefix={<SafetyOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Validations"
              value={stats.totalComplianceLogs}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Risk Distribution" extra={<PieChartOutlined />}>
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Compliance Trend" extra={<LineChartOutlined />}>
            <Line {...lineConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="Country Management" 
            extra={
              <Space>
                <Select
                  placeholder="Filter by risk level"
                  style={{ width: 150 }}
                  value={riskLevelFilter}
                  onChange={setRiskLevelFilter}
                >
                  <Option value="all">All Levels</Option>
                  <Option value="low">Low Risk</Option>
                  <Option value="medium">Medium Risk</Option>
                  <Option value="high">High Risk</Option>
                  <Option value="critical">Critical Risk</Option>
                </Select>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: 250 }}
                />
                <Button type="primary">Export Report</Button>
              </Space>
            }
          >
            <Table
              columns={countryColumns}
              dataSource={countries.filter(country => 
                riskLevelFilter === 'all' || country.riskLevel === riskLevelFilter
              )}
              rowKey="code"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Compliance Logs" extra={<SafetyOutlined />}>
            <Table
              columns={complianceColumns}
              dataSource={complianceLogs}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Route Validation Summary" extra={<GlobalOutlined />}>
            <Table
              columns={routeColumns}
              dataSource={routeValidations}
              rowKey={(record) => `${record.originCountry}-${record.destinationCountry}`}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Alert
            message="Country Layer Status"
            description="All country validation services are operational. Last system check: 5 minutes ago."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        </Col>
      </Row>
    </div>
  );
};

export default CountryDashboard;