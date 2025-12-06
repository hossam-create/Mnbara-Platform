import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MLInsights = () => {
  const [loading] = useState(false);

  // Mock ML insights data
  const predictionAccuracy = 87.5;
  const recommendationClickRate = 34.2;
  const conversionRate = 12.8;

  const userBehaviorPredictions = [
    { metric: 'Purchase Intent', score: 78, trend: 'up' },
    { metric: 'Churn Risk', score: 23, trend: 'down' },
    { metric: 'Engagement Score', score: 85, trend: 'up' },
    { metric: 'Lifetime Value', score: 92, trend: 'up' },
  ];

  const topRecommendations = [
    { product: 'iPhone 15 Pro', clicks: 1250, conversions: 180, rate: 14.4 },
    { product: 'MacBook Pro M3', clicks: 980, conversions: 145, rate: 14.8 },
    { product: 'AirPods Pro', clicks: 2100, conversions: 420, rate: 20.0 },
    { product: 'iPad Air', clicks: 750, conversions: 98, rate: 13.1 },
    { product: 'Apple Watch', clicks: 1450, conversions: 210, rate: 14.5 },
  ];

  const performanceTrend = [
    { date: '2025-11-27', accuracy: 82, clicks: 28 },
    { date: '2025-11-28', accuracy: 84, clicks: 30 },
    { date: '2025-11-29', accuracy: 85, clicks: 32 },
    { date: '2025-11-30', accuracy: 86, clicks: 33 },
    { date: '2025-12-01', accuracy: 87, clicks: 34 },
    { date: '2025-12-02', accuracy: 88, clicks: 35 },
    { date: '2025-12-03', accuracy: 87.5, clicks: 34.2 },
  ];

  const columns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'Clicks',
      dataIndex: 'clicks',
      key: 'clicks',
      align: 'right' as const,
    },
    {
      title: 'Conversions',
      dataIndex: 'conversions',
      key: 'conversions',
      align: 'right' as const,
    },
    {
      title: 'Conversion Rate',
      dataIndex: 'rate',
      key: 'rate',
      align: 'right' as const,
      render: (rate: number) => `${rate.toFixed(1)}%`,
    },
  ];

  return (
    <div>
      <h1>ML Insights Dashboard</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Prediction Accuracy"
              value={predictionAccuracy}
              precision={1}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress percent={predictionAccuracy} showInfo={false} strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Recommendation Click Rate"
              value={recommendationClickRate}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress
              percent={recommendationClickRate}
              showInfo={false}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={conversionRate}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Progress percent={conversionRate} showInfo={false} strokeColor="#faad14" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="User Behavior Predictions">
            {userBehaviorPredictions.map((item, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{item.metric}</span>
                  <span>
                    {item.trend === 'up' ? (
                      <RiseOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <FallOutlined style={{ color: '#ff4d4f' }} />
                    )}
                  </span>
                </div>
                <Progress
                  percent={item.score}
                  strokeColor={item.trend === 'up' ? '#52c41a' : '#ff4d4f'}
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="ML Performance Trend">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#8884d8"
                  name="Accuracy %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#82ca9d"
                  name="Click Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="Top Recommended Products">
            <Table
              columns={columns}
              dataSource={topRecommendations}
              rowKey="product"
              loading={loading}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Recommendation Performance by Category">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRecommendations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks" fill="#8884d8" name="Clicks" />
                <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MLInsights;
