import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, DatePicker, Button, Space, Typography } from 'antd';
import { Line, Bar, Pie } from '@ant-design/charts';
import { useTranslation } from 'react-i18next';
import { EyeOutlined, HeartOutlined, MessageOutlined, DollarOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import styles from './LiveStreamAnalytics.module.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface StreamAnalytics {
  streamId: string;
  totalViewers: number;
  peakViewers: number;
  averageViewers: number;
  totalWatchTime: number;
  chatMessages: number;
  likes: number;
  revenue: number;
  duration: number;
  startTime: string;
  endTime: string;
  category: string;
}

interface ViewerMetrics {
  timestamp: string;
  viewers: number;
  chatMessages: number;
  likes: number;
}

interface RevenueData {
  source: string;
  amount: number;
  color: string;
}

interface LiveStreamAnalyticsProps {
  streamId?: string;
  dateRange?: [string, string];
}

export const LiveStreamAnalytics: React.FC<LiveStreamAnalyticsProps> = ({
  streamId,
  dateRange
}) => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const [viewerMetrics, setViewerMetrics] = useState<ViewerMetrics[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string]>(
    dateRange || [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString()]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [streamId, selectedDateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: selectedDateRange[0],
        endDate: selectedDateRange[1],
        ...(streamId && { streamId })
      });

      const baseUrl = process.env.REACT_APP_LIVE_SERVICE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        setViewerMetrics(data.viewerMetrics);
        setRevenueData(data.revenueData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const viewerChartConfig = {
    data: viewerMetrics,
    xField: 'timestamp',
    yField: 'viewers',
    smooth: true,
    color: '#667eea',
    point: {
      size: 3,
      shape: 'circle',
      style: {
        fill: '#667eea',
        stroke: '#fff',
        strokeWidth: 2
      }
    },
    area: {
      style: {
        fill: 'l(270) 0:#ffffff 0.5:#667eea 1:#667eea',
        fillOpacity: 0.3
      }
    },
    xAxis: {
      title: {
        text: t('analytics.time'),
        style: { fill: '#6c757d' }
      },
      label: {
        style: { fill: '#6c757d' }
      }
    },
    yAxis: {
      title: {
        text: t('analytics.viewers'),
        style: { fill: '#6c757d' }
      },
      label: {
        style: { fill: '#6c757d' }
      }
    },
    tooltip: {
      showMarkers: true,
      formatter: (datum: any) => {
        return {
          name: t('analytics.viewers'),
          value: datum.viewers
        };
      }
    }
  };

  const engagementChartConfig = {
    data: [
      {
        type: t('analytics.chatMessages'),
        value: analytics?.chatMessages || 0,
        color: '#667eea'
      },
      {
        type: t('analytics.likes'),
        value: analytics?.likes || 0,
        color: '#ff6b6b'
      },
      {
        type: t('analytics.totalViewers'),
        value: analytics?.totalViewers || 0,
        color: '#4ecdc4'
      }
    ],
    xField: 'type',
    yField: 'value',
    colorField: 'color',
    columnStyle: {
      radius: [8, 8, 0, 0]
    },
    xAxis: {
      label: {
        style: { fill: '#6c757d' }
      }
    },
    yAxis: {
      label: {
        style: { fill: '#6c757d' }
      }
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: datum.value.toLocaleString()
        };
      }
    }
  };

  const revenueChartConfig = {
    data: revenueData,
    angleField: 'amount',
    colorField: 'source',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}'
    },
    interactions: [
      {
        type: 'element-active'
      }
    ],
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.source,
          value: formatCurrency(datum.amount)
        };
      }
    }
  };

  const columns = [
    {
      title: t('analytics.streamTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: t('analytics.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue" className={styles.categoryTag}>
          {category}
        </Tag>
      )
    },
    {
      title: t('analytics.viewers'),
      dataIndex: 'totalViewers',
      key: 'totalViewers',
      render: (count: number) => (
        <Space>
          <EyeOutlined />
          <Text>{count.toLocaleString()}</Text>
        </Space>
      )
    },
    {
      title: t('analytics.duration'),
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => formatDuration(duration)
    },
    {
      title: t('analytics.revenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(revenue)}
        </Text>
      )
    },
    {
      title: t('analytics.date'),
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: string) => (
        <Text>{new Date(date).toLocaleDateString()}</Text>
      )
    }
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <Card className={styles.loadingCard}>
          <div className={styles.loadingHeader} />
          <Row gutter={[24, 24]}>
            {[...Array(8)].map((_, index) => (
              <Col key={index} span={6}>
                <div className={styles.loadingStat} />
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.headerCard}>
        <div className={styles.header}>
          <Title level={2} className={styles.title}>
            {t('analytics.streamAnalytics')}
          </Title>
          <Space>
            <RangePicker
              value={[
                new Date(selectedDateRange[0]),
                new Date(selectedDateRange[1])
              ]}
              onChange={(dates) => {
                if (dates) {
                  setSelectedDateRange([
                    dates[0]!.toISOString(),
                    dates[1]!.toISOString()
                  ]);
                }
              }}
              className={styles.datePicker}
            />
            <Button type="primary" onClick={fetchAnalytics}>
              {t('common.refresh')}
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[24, 24]} className={styles.statsRow}>
        <Col span={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('analytics.totalViewers')}
              value={analytics?.totalViewers || 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('analytics.peakViewers')}
              value={analytics?.peakViewers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#4ecdc4' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('analytics.totalWatchTime')}
              value={analytics?.totalWatchTime || 0}
              formatter={(value) => formatDuration(value as number)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff6b6b' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard}>
            <Statistic
              title={t('analytics.totalRevenue')}
              value={analytics?.revenue || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className={styles.chartsRow}>
        <Col span={16}>
          <Card className={styles.chartCard}>
            <Title level={4} className={styles.chartTitle}>
              {t('analytics.viewerTrends')}
            </Title>
            <Line {...viewerChartConfig} className={styles.chart} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className={styles.chartCard}>
            <Title level={4} className={styles.chartTitle}>
              {t('analytics.engagement')}
            </Title>
            <Bar {...engagementChartConfig} className={styles.chart} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className={styles.chartsRow}>
        <Col span={8}>
          <Card className={styles.chartCard}>
            <Title level={4} className={styles.chartTitle}>
              {t('analytics.revenueBreakdown')}
            </Title>
            <Pie {...revenueChartConfig} className={styles.chart} />
          </Card>
        </Col>
        <Col span={16}>
          <Card className={styles.tableCard}>
            <Title level={4} className={styles.tableTitle}>
              {t('analytics.recentStreams')}
            </Title>
            <Table
              columns={columns}
              dataSource={[]}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              className={styles.analyticsTable}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LiveStreamAnalytics;