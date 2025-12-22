/**
 * Reports Page
 * Requirements: 13.4 - Provide export functionality for reports
 * - Add export buttons for CSV/Excel download
 * - Implement date range selection for exports
 */

import { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  DatePicker,
  Select,
  Space,
  Typography,
  Table,
  message,
  Divider,
  Tag,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  HistoryOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  CarOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { analyticsService, ReportExportParams } from '../services/admin.service';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

interface ReportType {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  formats: ('csv' | 'excel')[];
}

interface ExportHistory {
  id: string;
  reportType: string;
  format: string;
  dateRange: string;
  exportedAt: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
}

const reportTypes: ReportType[] = [
  {
    key: 'transactions',
    name: 'Transaction Report',
    description: 'All platform transactions including payments, refunds, and escrow operations',
    icon: <DollarOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    formats: ['csv', 'excel'],
  },
  {
    key: 'users',
    name: 'User Report',
    description: 'User registrations, activity metrics, and KYC status',
    icon: <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    formats: ['csv', 'excel'],
  },
  {
    key: 'orders',
    name: 'Orders Report',
    description: 'Order details, status, and fulfillment metrics',
    icon: <ShoppingOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    formats: ['csv', 'excel'],
  },
  {
    key: 'auctions',
    name: 'Auction Report',
    description: 'Auction activity, bids, and completion rates',
    icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    formats: ['csv', 'excel'],
  },
  {
    key: 'crowdship',
    name: 'Crowdship Report',
    description: 'Delivery metrics, traveler performance, and earnings',
    icon: <CarOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
    formats: ['csv', 'excel'],
  },
];

const Reports = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [selectedReport, setSelectedReport] = useState<string>('transactions');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel'>('csv');
  const [exporting, setExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([
    {
      id: '1',
      reportType: 'Transaction Report',
      format: 'CSV',
      dateRange: 'Nov 12, 2025 - Dec 12, 2025',
      exportedAt: new Date().toISOString(),
      status: 'completed',
    },
    {
      id: '2',
      reportType: 'User Report',
      format: 'Excel',
      dateRange: 'Nov 01, 2025 - Nov 30, 2025',
      exportedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'completed',
    },
  ]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: ReportExportParams = {
        type: selectedReport as ReportExportParams['type'],
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        format: selectedFormat,
      };

      const blob = await analyticsService.exportReport(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}_report_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.${selectedFormat === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Add to export history
      const reportName = reportTypes.find((r) => r.key === selectedReport)?.name || selectedReport;
      setExportHistory((prev) => [
        {
          id: Date.now().toString(),
          reportType: reportName,
          format: selectedFormat.toUpperCase(),
          dateRange: `${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`,
          exportedAt: new Date().toISOString(),
          status: 'completed',
        },
        ...prev,
      ]);

      message.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleQuickExport = async (reportKey: string, format: 'csv' | 'excel') => {
    setExporting(true);
    try {
      const params: ReportExportParams = {
        type: reportKey as ReportExportParams['type'],
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        format,
      };

      const blob = await analyticsService.exportReport(params);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportKey}_report_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const reportName = reportTypes.find((r) => r.key === reportKey)?.name || reportKey;
      setExportHistory((prev) => [
        {
          id: Date.now().toString(),
          reportType: reportName,
          format: format.toUpperCase(),
          dateRange: `${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`,
          exportedAt: new Date().toISOString(),
          status: 'completed',
        },
        ...prev,
      ]);

      message.success(`${reportName} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const historyColumns = [
    {
      title: 'Report Type',
      dataIndex: 'reportType',
      key: 'reportType',
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => (
        <Tag color={format === 'CSV' ? 'blue' : 'green'}>{format}</Tag>
      ),
    },
    {
      title: 'Date Range',
      dataIndex: 'dateRange',
      key: 'dateRange',
    },
    {
      title: 'Exported At',
      dataIndex: 'exportedAt',
      key: 'exportedAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          completed: 'success',
          processing: 'processing',
          failed: 'error',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Reports & Export</Title>

      {/* Date Range Selection */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text strong>Select Date Range for Reports</Text>
          <Space wrap>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              presets={[
                { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
                { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
                { label: 'Last 3 Months', value: [dayjs().subtract(3, 'month'), dayjs()] },
                { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
                { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                { label: 'This Year', value: [dayjs().startOf('year'), dayjs()] },
              ]}
              style={{ width: 300 }}
            />
          </Space>
        </Space>
      </Card>

      {/* Quick Export Cards */}
      <Title level={4}>Available Reports</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {reportTypes.map((report) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={report.key}>
            <Card
              hoverable
              style={{
                height: '100%',
                border: selectedReport === report.key ? '2px solid #1890ff' : undefined,
              }}
              onClick={() => setSelectedReport(report.key)}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  {report.icon}
                  <Text strong>{report.name}</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {report.description}
                </Text>
                <Divider style={{ margin: '12px 0' }} />
                <Space>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickExport(report.key, 'csv');
                    }}
                    loading={exporting}
                  >
                    CSV
                  </Button>
                  <Button
                    size="small"
                    icon={<FileExcelOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickExport(report.key, 'excel');
                    }}
                    loading={exporting}
                  >
                    Excel
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Custom Export Section */}
      <Card title="Custom Export" style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            value={selectedReport}
            onChange={setSelectedReport}
            style={{ width: 200 }}
          >
            {reportTypes.map((report) => (
              <Option key={report.key} value={report.key}>
                {report.name}
              </Option>
            ))}
          </Select>
          <Select
            value={selectedFormat}
            onChange={setSelectedFormat}
            style={{ width: 120 }}
          >
            <Option value="csv">CSV</Option>
            <Option value="excel">Excel</Option>
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            Export Report
          </Button>
        </Space>
      </Card>

      {/* Export History */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <span>Export History</span>
          </Space>
        }
      >
        <Table
          dataSource={exportHistory}
          columns={historyColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'No export history' }}
        />
      </Card>
    </div>
  );
};

export default Reports;
