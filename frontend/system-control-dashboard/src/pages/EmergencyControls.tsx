import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

const EmergencyControls: React.FC = () => {
  return (
    <div className="cockpit-page">
      <div className="cockpit-header">
        <Title level={2} style={{ color: '#fff' }}>
          Emergency Controls
        </Title>
      </div>
      <Alert
        message="Emergency Controls"
        description="Emergency control systems - Coming Soon"
        type="warning"
        showIcon
      />
    </div>
  );
};

export default EmergencyControls;