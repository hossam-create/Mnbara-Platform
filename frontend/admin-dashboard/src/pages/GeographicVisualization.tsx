import { useEffect, useState } from 'react';
import { Card, Select, Spin } from 'antd';
import axios from 'axios';

const { Option } = Select;

// Note: In production, use react-leaflet or mapbox-gl
// For now, we'll create a simple visualization

interface UserLocation {
  country: string;
  city: string;
  count: number;
  lat?: number;
  lng?: number;
}

const GeographicVisualization = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [locations, setLocations] = useState<UserLocation[]>([]);

  useEffect(() => {
    fetchLocationData();
  }, [period]);

  const fetchLocationData = async () => {
    setLoading(true);
    try {
      // Get user locations from sessions
      const response = await this.db.query(
        `SELECT 
          country,
          city,
          COUNT(DISTINCT user_id) as count
         FROM user_sessions
         WHERE login_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : period === '30d' ? '30 days' : '1 year'}'
         GROUP BY country, city
         ORDER BY count DESC
         LIMIT 50`
      );

      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching location data:', error);
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
        <h1>Geographic Distribution</h1>
        <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
          <Option value="7d">Last 7 Days</Option>
          <Option value="30d">Last 30 Days</Option>
          <Option value="1y">Last Year</Option>
        </Select>
      </div>

      <Card title="User Locations" style={{ marginBottom: 16 }}>
        <div style={{ height: 400, background: '#f0f2f5', borderRadius: 8, padding: 16 }}>
          {/* Placeholder for map - In production, integrate Leaflet or Mapbox */}
          <div style={{ textAlign: 'center', paddingTop: 150 }}>
            <h3>Interactive Map Placeholder</h3>
            <p>Integrate with Leaflet or Mapbox for production</p>
          </div>
        </div>
      </Card>

      <Card title="Top Locations">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Rank</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Country</th>
              <th style={{ padding: 12, textAlign: 'left' }}>City</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Users</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 12 }}>{index + 1}</td>
                <td style={{ padding: 12 }}>{location.country}</td>
                <td style={{ padding: 12 }}>{location.city}</td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                  {location.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default GeographicVisualization;
