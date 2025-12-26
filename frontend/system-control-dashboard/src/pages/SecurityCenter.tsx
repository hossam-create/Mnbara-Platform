import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const SecurityCenter: React.FC = () => {
  return (
    <div className="cockpit-page">
      <div className="cockpit-header">
        <Title level={2} style={{ color: '#fff' }}>
          Security Center
        </Title>
      </div>
      <Card className="glass-panel">
        <p>Security monitoring and controls - Coming Soon</p>
      </Card>
    </div>
  );
};

export default SecurityCenter;