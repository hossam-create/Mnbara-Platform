/**
 * User Detail Page - Admin User Management
 * Requirements: 11.2 - Display profile, transaction history, and KYC status
 * Requirements: 11.3 - Allow admins to approve/reject KYC
 * Requirements: 11.4 - Allow admins to suspend/ban users
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  Tabs,
  Avatar,
  Row,
  Col,
  Statistic,
  Modal,
  Input,
  message,
  Image,
  Spin,
  Popconfirm,
} from 'antd';
import {
  UserOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { adminService, UserDetail as UserDetailType } from '../services/admin.service';

const { TextArea } = Input;

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetailType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [kycRejectModalVisible, setKycRejectModalVisible] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUser(userId!);
      setUser(data);
    } catch (error) {
      message.error('Failed to fetch user details');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: 'active' | 'suspended' | 'banned', reason?: string) => {
    setActionLoading(true);
    try {
      await adminService.updateUserStatus(userId!, status, reason);
      message.success(`User ${status === 'active' ? 'activated' : status}`);
      fetchUser();
      setSuspendModalVisible(false);
      setSuspendReason('');
    } catch (error) {
      message.error('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKYCApprove = async () => {
    if (!user?.kycDocuments?.[0]) return;
    setActionLoading(true);
    try {
      await adminService.approveKYC(user.kycDocuments[0].id);
      message.success('KYC approved successfully');
      fetchUser();
    } catch (error) {
      message.error('Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleKYCReject = async () => {
    if (!user?.kycDocuments?.[0] || !kycRejectReason) return;
    setActionLoading(true);
    try {
      await adminService.rejectKYC(user.kycDocuments[0].id, kycRejectReason);
      message.success('KYC rejected');
      fetchUser();
      setKycRejectModalVisible(false);
      setKycRejectReason('');
    } catch (error) {
      message.error('Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'banned': return 'error';
      default: return 'default';
    }
  };

  const transactionColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => id.slice(0, 8) },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag>{type.replace('_', ' ').toUpperCase()}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount: number, record: any) => `${record.currency} ${amount.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'completed' ? 'success' : status === 'pending' ? 'processing' : 'error'}>{status.toUpperCase()}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString() },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ];

  const orderColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => id.slice(0, 8) },
    { title: 'Item', dataIndex: 'listingTitle', key: 'listingTitle' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount: number) => `$${amount.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag>{status.toUpperCase()}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleDateString() },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  const tabItems = [
    {
      key: 'transactions',
      label: 'Transactions',
      children: <Table columns={transactionColumns} dataSource={user.transactions} rowKey="id" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'orders',
      label: 'Orders',
      children: <Table columns={orderColumns} dataSource={user.orders} rowKey="id" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'kyc',
      label: 'KYC Documents',
      children: user.kycDocuments?.length ? (
        <div>
          {user.kycDocuments.map((doc) => (
            <Card key={doc.id} style={{ marginBottom: 16 }}>
              <Descriptions title={`${doc.type.replace('_', ' ').toUpperCase()}`} column={2}>
                <Descriptions.Item label="Status"><Tag color={doc.status === 'approved' ? 'success' : doc.status === 'pending' ? 'processing' : 'error'}>{doc.status.toUpperCase()}</Tag></Descriptions.Item>
                <Descriptions.Item label="Submitted">{new Date(doc.submittedAt).toLocaleString()}</Descriptions.Item>
                {doc.reviewedAt && <Descriptions.Item label="Reviewed">{new Date(doc.reviewedAt).toLocaleString()}</Descriptions.Item>}
                {doc.rejectionReason && <Descriptions.Item label="Rejection Reason">{doc.rejectionReason}</Descriptions.Item>}
              </Descriptions>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={8}><div style={{ textAlign: 'center' }}><Image src={doc.frontImageUrl} width={200} /><div>Front</div></div></Col>
                {doc.backImageUrl && <Col span={8}><div style={{ textAlign: 'center' }}><Image src={doc.backImageUrl} width={200} /><div>Back</div></div></Col>}
                <Col span={8}><div style={{ textAlign: 'center' }}><Image src={doc.selfieUrl} width={200} /><div>Selfie</div></div></Col>
              </Row>
              {doc.status === 'pending' && (
                <Space style={{ marginTop: 16 }}>
                  <Popconfirm title="Approve this KYC submission?" onConfirm={handleKYCApprove} okText="Approve" cancelText="Cancel">
                    <Button type="primary" icon={<CheckCircleOutlined />} loading={actionLoading}>Approve</Button>
                  </Popconfirm>
                  <Button danger icon={<CloseCircleOutlined />} onClick={() => setKycRejectModalVisible(true)}>Reject</Button>
                </Space>
              )}
            </Card>
          ))}
        </div>
      ) : <div>No KYC documents submitted</div>,
    },
  ];

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')} style={{ marginBottom: 16 }}>Back to Users</Button>
      <Card>
        <Row gutter={24}>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Avatar size={120} src={user.avatarUrl} icon={<UserOutlined />} />
            <h2 style={{ marginTop: 16 }}>{user.fullName}</h2>
            <Tag color={getStatusColor(user.status)}>{user.status.toUpperCase()}</Tag>
          </Col>
          <Col span={18}>
            <Descriptions column={3}>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{user.phone || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Role"><Tag>{user.role.toUpperCase()}</Tag></Descriptions.Item>
              <Descriptions.Item label="KYC Status"><Tag color={user.kycStatus === 'verified' ? 'success' : user.kycStatus === 'pending' ? 'processing' : 'default'}>{user.kycStatus.toUpperCase()}</Tag></Descriptions.Item>
              <Descriptions.Item label="Rating">⭐ {user.ratingAvg?.toFixed(1) || '0.0'}</Descriptions.Item>
              <Descriptions.Item label="Joined">{new Date(user.createdAt).toLocaleDateString()}</Descriptions.Item>
              <Descriptions.Item label="Last Login">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</Descriptions.Item>
              <Descriptions.Item label="Last Location">{user.lastLoginCountry || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Device">{user.lastLoginDevice || 'N/A'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }}>
              {user.status === 'active' && (
                <Button icon={<ExclamationCircleOutlined />} onClick={() => setSuspendModalVisible(true)}>Suspend User</Button>
              )}
              {user.status === 'suspended' && (
                <>
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange('active')} loading={actionLoading}>Activate User</Button>
                  <Popconfirm title="Ban this user permanently?" onConfirm={() => handleStatusChange('banned')} okText="Ban" okButtonProps={{ danger: true }}>
                    <Button danger icon={<StopOutlined />}>Ban User</Button>
                  </Popconfirm>
                </>
              )}
              {user.status === 'banned' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange('active')} loading={actionLoading}>Unban User</Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}><Card><Statistic title="Total Orders" value={user.totalOrders} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Spent" value={user.totalSpent} prefix="$" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Earnings" value={user.totalEarnings} prefix="$" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="Wallet Balance" value={user.walletBalance} prefix="$" precision={2} /></Card></Col>
      </Row>
      <Card style={{ marginTop: 24 }}><Tabs items={tabItems} /></Card>
      <Modal title="Suspend User" open={suspendModalVisible} onOk={() => handleStatusChange('suspended', suspendReason)} onCancel={() => setSuspendModalVisible(false)} confirmLoading={actionLoading}>
        <p>Please provide a reason for suspending this user:</p>
        <TextArea rows={4} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Reason for suspension..." />
      </Modal>
      <Modal title="Reject KYC" open={kycRejectModalVisible} onOk={handleKYCReject} onCancel={() => setKycRejectModalVisible(false)} confirmLoading={actionLoading}>
        <p>Please provide a reason for rejecting this KYC submission:</p>
        <TextArea rows={4} value={kycRejectReason} onChange={(e) => setKycRejectReason(e.target.value)} placeholder="Reason for rejection..." />
      </Modal>
    </div>
  );
};

export default UserDetail;
