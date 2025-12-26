import React from 'react';
import { Card, Typography } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const DepartmentPortal: React.FC = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="cockpit-page">
      <div className="cockpit-header">
        <Title level={2} style={{ color: '#fff' }}>
          Department Portal: {departmentId}
        </Title>
      </div>
      <Card className="glass-panel">
        <p>Department portal for {departmentId} - Coming Soon</p>
      </Card>
    </div>
  );
};

export default DepartmentPortal;