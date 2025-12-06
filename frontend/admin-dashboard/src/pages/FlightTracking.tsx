import { useEffect, useState } from 'react';
import { Card, Table, Tag, Timeline, Statistic, Row, Col } from 'antd';
import { ClockCircleOutlined, RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

interface Flight {
  id: number;
  trip_id: number;
  traveler_id: number;
  first_name: string;
  last_name: string;
  email: string;
  flight_number: string;
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure?: string;
  actual_arrival?: string;
  flight_status: string;
}

const FlightTracking = () => {
  const [loading, setLoading] = useState(false);
  const [activeFlights, setActiveFlights] = useState<Flight[]>([]);
  const [allFlights, setAllFlights] = useState<Flight[]>([]);

  useEffect(() => {
    fetchFlights();
    // Refresh every 30 seconds
    const interval = setInterval(fetchFlights, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        axios.get('/api/admin/flights/active'),
        axios.get('/api/admin/flights?limit=50'),
      ]);

      setActiveFlights(activeRes.data);
      setAllFlights(allRes.data.data);
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'blue',
      DELAYED: 'orange',
      IN_FLIGHT: 'green',
      LANDED: 'default',
      CANCELLED: 'red',
    };
    return colors[status] || 'default';
  };

  const columns: ColumnsType<Flight> = [
    {
      title: 'Flight',
      key: 'flight',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.flight_number}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.airline}</div>
        </div>
      ),
    },
    {
      title: 'Traveler',
      key: 'traveler',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Route',
      key: 'route',
      render: (_, record) => `${record.departure_airport} → ${record.arrival_airport}`,
    },
    {
      title: 'Departure',
      dataIndex: 'scheduled_departure',
      key: 'departure',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Arrival',
      dataIndex: 'scheduled_arrival',
      key: 'arrival',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'flight_status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
  ];

  const scheduledCount = allFlights.filter((f) => f.flight_status === 'SCHEDULED').length;
  const inFlightCount = allFlights.filter((f) => f.flight_status === 'IN_FLIGHT').length;
  const landedCount = allFlights.filter((f) => f.flight_status === 'LANDED').length;

  return (
    <div>
      <h1>Flight Tracking Dashboard</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Scheduled"
              value={scheduledCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="In Flight"
              value={inFlightCount}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Landed"
              value={landedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Active Flights (Next 48 Hours)">
            <Timeline>
              {activeFlights.slice(0, 10).map((flight) => (
                <Timeline.Item
                  key={flight.id}
                  color={getStatusColor(flight.flight_status)}
                  dot={
                    flight.flight_status === 'IN_FLIGHT' ? (
                      <RocketOutlined style={{ fontSize: '16px' }} />
                    ) : undefined
                  }
                >
                  <div>
                    <strong>{flight.flight_number}</strong> - {flight.airline}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {flight.departure_airport} → {flight.arrival_airport}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {new Date(flight.scheduled_departure).toLocaleString()}
                  </div>
                  <Tag color={getStatusColor(flight.flight_status)} size="small">
                    {flight.flight_status}
                  </Tag>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Flight Map Placeholder">
            <div
              style={{
                height: 400,
                background: '#f0f2f5',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <RocketOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <h3>Flight Map</h3>
                <p>Integrate with flight tracking API for live map</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="All Flights">
        <Table
          columns={columns}
          dataSource={allFlights}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default FlightTracking;
