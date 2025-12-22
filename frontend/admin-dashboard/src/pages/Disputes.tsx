/**
 * Disputes Page - Dispute Management Dashboard
 * Requirements: Display dispute cases, resolution tools, and analytics
 * RBAC: Requires VIEW_DISPUTES permission
 */

import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Alert } from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EditOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { DisputesGuard } from '../components/RBACGuard';
import { useAuth, Permissions } from '../contexts/AuthContext';

const Disputes: React.FC = () => {
  const auth = useAuth();
  
  // Mock data for disputes dashboard
  const disputeStats = {
    total: 47,
    pending: 23,
    resolved: 18,
    escalated: 6
  };

  const disputeData = [
    {
      key: '1',
      id: 'D-001',
      customer: 'Ahmed Mohamed',
      type: 'Payment Dispute',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15',
      assignedTo: 'Support Team'
    },
    {
      key: '2',
      id: 'D-002',
      customer: 'Sarah Johnson',
      type: 'Service Quality',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2024-01-14',
      assignedTo: 'John Doe'
    },
    {
      key: '3',
      id: 'D-003',
      customer: 'Mohammed Ali',
      type: 'Refund Request',
      status: 'resolved',
      priority: 'low',
      createdAt: '2024-01-13',
      assignedTo: 'Jane Smith'
    },
    {
      key: '4',
      id: 'D-004',
      customer: 'Fatima Hassan',
      type: 'Technical Issue',
      status: 'escalated',
      priority: 'high',
      createdAt: '2024-01-12',
      assignedTo: 'Engineering'
    }
  ];

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'pending':
            color = 'orange';
            icon = <ClockCircleOutlined />;
            break;
          case 'in_progress':
            color = 'blue';
            icon = <SyncOutlined spin />;
            break;
          case 'resolved':
            color = 'green';
            icon = <CheckCircleOutlined />;
            break;
          case 'escalated':
            color = 'red';
            icon = <WarningOutlined />;
            break;
        }
        
        return (
          <Tag color={color}>
            {icon} {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green';
        return <Tag color={color}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>
            View
          </Button>
          {auth.hasPermission(Permissions.RESOLVE_DISPUTES) && (
            <Button size="small" icon={<EditOutlined />} type="primary">
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <DisputesGuard>
      <div style={{ padding: '24px' }}>
        <h1 style={{ marginBottom: '24px' }}>
          <FileSearchOutlined /> Dispute Management
        </h1>

        {/* User Role/Permission Info */}
        {auth.user && (
          <Alert
            message={
              <Space>
                <span>Dispute Management Access: <strong>{auth.user.email}</strong></span>
                <Tag color="blue">{auth.user.role}</Tag>
                {auth.hasPermission(Permissions.RESOLVE_DISPUTES) && (
                  <Tag color="green">Can Resolve Disputes</Tag>
                )}
              </Space>
            }
            type="info"
            style={{ marginBottom: '24px' }}
            showIcon
          />
        )}

        {/* Dispute Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Disputes"
                value={disputeStats.total}
                prefix={<FileSearchOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Pending"
                value={disputeStats.pending}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Resolved"
                value={disputeStats.resolved}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Escalated"
                value={disputeStats.escalated}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* Dispute Actions */}
        {auth.hasPermission(Permissions.RESOLVE_DISPUTES) && (
          <Card style={{ marginBottom: '24px' }}>
            <Space>
              <Button type="primary" icon={<FileSearchOutlined />}>
                New Dispute Case
              </Button>
              <Button icon={<CheckCircleOutlined />}>
                Bulk Resolve
              </Button>
              <Button icon={<WarningOutlined />}>
                Escalate Selected
              </Button>
            </Space>
          </Card>
        )}

        {/* Dispute Table */}
        <Card title="Recent Disputes">
          <Table
            columns={columns}
            dataSource={disputeData}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Resolution Tools */}
        {auth.hasPermission(Permissions.RESOLVE_DISPUTES) && (
          <Card title="Resolution Tools" style={{ marginTop: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" title="Quick Resolution">
                  <p>Standard resolution templates and workflows</p>
                  <Button type="link">View Templates</Button>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" title="Analytics">
                  <p>Dispute resolution metrics and trends</p>
                  <Button type="link">View Analytics</Button>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small" title="Escalation">
                  <p>Escalate to senior support or management</p>
                  <Button type="link">Escalate Case</Button>
                </Card>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    </DisputesGuard>
  );
};

export default Disputes;