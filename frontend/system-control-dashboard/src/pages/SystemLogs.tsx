import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const SystemLogs: React.FC = () => {
  return (
    <div className="cockpit-page">
      <div className="cockpit-header">
        <Title level={2} style={{ color: '#fff' }}>
          System Logs
        </Title>
      </div>
      <Card className="glass-panel">
        <p>System logs viewer - Coming Soon</p>
      </Card>
    </div>
  );
};

export default SystemLogs;