import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const PerformanceMonitoring: React.FC = () => {
  return (
    <div className="cockpit-page">
      <div className="cockpit-header">
        <Title level={2} style={{ color: '#fff' }}>
          Performance Monitoring
        </Title>
      </div>
      <Card className="glass-panel">
        <p>Performance monitoring dashboard - Coming Soon</p>
      </Card>
    </div>
  );
};

export default PerformanceMonitoring;