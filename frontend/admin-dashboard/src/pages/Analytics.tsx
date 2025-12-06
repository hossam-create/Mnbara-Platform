import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Select, Spin } from 'antd';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const { Option } = Select;

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<any>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [usersRes, ordersRes, revenueRes] = await Promise.all([
        axios.get(`/api/admin/analytics/users?period=${period}`),
        axios.get(`/api/admin/analytics/orders?period=${period}`),
        axios.get(`/api/admin/analytics/revenue?period=${period}`),
      ]);

      setUserAnalytics(usersRes.data);
      setOrderAnalytics(ordersRes.data);
      setRevenueAnalytics(revenueRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Analytics</h1>
        <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
          <Option value="7d">Last 7 Days</Option>
          <Option value="30d">Last 30 Days</Option>
          <Option value="3m">Last 3 Months</Option>
          <Option value="1y">Last Year</Option>
        </Select>
      </div>

      {/* User Analytics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Users" value={userAnalytics?.totalUsers || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="New Users" value={userAnalytics?.newUsers || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active Users" value={userAnalytics?.activeUsers || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Retention Rate"
              value={userAnalytics?.retentionRate || 0}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Order Analytics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Order Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderAnalytics?.byStatus || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Revenue Analytics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={revenueAnalytics?.totalRevenue || 0}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Commission Earned"
              value={revenueAnalytics?.commission || 0}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Escrow Held"
              value={revenueAnalytics?.escrowHeld || 0}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="Revenue by Category">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueAnalytics?.byCategory || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
