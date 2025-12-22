/**
 * KYC Management Page
 * Requirements: 11.3 - KYC approval workflow with document viewer
 */

import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Modal, Input, Card, Space, message, Row, Col, Image, Statistic, Avatar, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, UserOutlined, FileProtectOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminService, KYCSubmission } from '../services/admin.service';

const { TextArea } = Input;

const KYCManagement = () => {
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getKYCSubmissions({ page, limit: 20, status: statusFilter });
      setSubmissions(response.data);
      setTotal(response.total);
    } catch (error) {
      message.error('Failed to load KYC submissions');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminService.approveKYC(id);
      message.success('KYC approved successfully');
      setIsModalVisible(false);
      fetchSubmissions();
    } catch (error) {
      message.error('Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      message.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.rejectKYC(selectedSubmission.id, rejectionReason);
      message.success('KYC rejected');
      setIsModalVisible(false);
      setRejectionReason('');
      fetchSubmissions();
    } catch (error) {
      message.error('Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };


  const columns: ColumnsType<KYCSubmission> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar src={record.user.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.user.fullName}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.user.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Document Type',
      key: 'documentType',
      render: (_, record) => record.documents[0]?.type.replace('_', ' ').toUpperCase() || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'approved' ? 'success' : status === 'pending' ? 'processing' : 'error'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedSubmission(record); setIsModalVisible(true); }}>View</Button>
          {record.status === 'pending' && (
            <>
              <Button icon={<CheckOutlined />} type="primary" size="small" onClick={() => handleApprove(record.id)}>Approve</Button>
              <Button icon={<CloseOutlined />} danger size="small" onClick={() => { setSelectedSubmission(record); setIsModalVisible(true); }}>Reject</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>KYC Verification Management</h1>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="Pending Review" value={stats.pending} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} /></Card></Col>
        <Col span={8}><Card><Statistic title="Approved" value={stats.approved} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
        <Col span={8}><Card><Statistic title="Rejected" value={stats.rejected} prefix={<CloseOutlined style={{ color: '#ff4d4f' }} />} /></Card></Col>
      </Row>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type={!statusFilter ? 'primary' : 'default'} onClick={() => setStatusFilter(undefined)}>All</Button>
          <Button type={statusFilter === 'pending' ? 'primary' : 'default'} onClick={() => setStatusFilter('pending')}>Pending</Button>
          <Button type={statusFilter === 'approved' ? 'primary' : 'default'} onClick={() => setStatusFilter('approved')}>Approved</Button>
          <Button type={statusFilter === 'rejected' ? 'primary' : 'default'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
        </Space>
      </Card>
      <Table columns={columns} dataSource={submissions} rowKey="id" loading={loading} pagination={{ current: page, pageSize: 20, total, onChange: setPage, showTotal: (t) => `Total ${t} submissions` }} />
      <Modal title="KYC Submission Details" open={isModalVisible} onCancel={() => { setIsModalVisible(false); setRejectionReason(''); }} width={800} footer={selectedSubmission?.status === 'pending' ? [
        <Button key="cancel" onClick={() => setIsModalVisible(false)}>Cancel</Button>,
        <Button key="approve" type="primary" loading={actionLoading} onClick={() => handleApprove(selectedSubmission.id)}>Approve</Button>,
        <Button key="reject" danger loading={actionLoading} onClick={handleReject}>Reject</Button>,
      ] : [<Button key="close" onClick={() => setIsModalVisible(false)}>Close</Button>]}>
        {selectedSubmission && (
          <div>
            <Descriptions column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Name">{selectedSubmission.user.fullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedSubmission.user.email}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={selectedSubmission.status === 'approved' ? 'success' : selectedSubmission.status === 'pending' ? 'processing' : 'error'}>{selectedSubmission.status.toUpperCase()}</Tag></Descriptions.Item>
              <Descriptions.Item label="Submitted">{new Date(selectedSubmission.submittedAt).toLocaleString()}</Descriptions.Item>
            </Descriptions>
            {selectedSubmission.documents.map((doc) => (
              <Card key={doc.id} title={doc.type.replace('_', ' ').toUpperCase()} style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}><div style={{ textAlign: 'center' }}><Image src={doc.frontImageUrl} width={180} /><div>Front</div></div></Col>
                  {doc.backImageUrl && <Col span={8}><div style={{ textAlign: 'center' }}><Image src={doc.backImageUrl} width={180} /><div>Back</div></div></Col>}
                  <Col span={8}><div style={{ textAlign: 'center' }}><Image src={doc.selfieUrl} width={180} /><div>Selfie</div></div></Col>
                </Row>
                {doc.rejectionReason && <div style={{ marginTop: 16, color: '#ff4d4f' }}><strong>Rejection Reason:</strong> {doc.rejectionReason}</div>}
              </Card>
            ))}
            {selectedSubmission.status === 'pending' && (
              <div style={{ marginTop: 16 }}>
                <strong>Rejection Reason (required if rejecting):</strong>
                <TextArea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Enter reason for rejection..." style={{ marginTop: 8 }} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KYCManagement;
