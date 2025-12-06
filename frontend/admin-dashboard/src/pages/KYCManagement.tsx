import { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Input, Card, Space, message } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;

interface KYCVerification {
  id: number;
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  document_type: string;
  country: string;
  submitted_at: string;
  verified_at?: string;
  rejection_reason?: string;
}

const KYCManagement = () => {
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState<KYCVerification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedVerification, setSelectedVerification] = useState<KYCVerification | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, [page, statusFilter]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;

      const response = await axios.get('/api/admin/kyc', { params });
      setVerifications(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching KYC verifications:', error);
      message.error('Failed to load KYC verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await axios.post(`/api/admin/kyc/verify/${id}`);
      message.success('KYC verification approved');
      fetchVerifications();
    } catch (error) {
      message.error('Failed to approve verification');
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason) {
      message.error('Please provide a rejection reason');
      return;
    }

    try {
      await axios.post(`/api/admin/kyc/reject/${selectedVerification.id}`, {
        reason: rejectionReason,
      });
      message.success('KYC verification rejected');
      setIsModalVisible(false);
      setRejectionReason('');
      fetchVerifications();
    } catch (error) {
      message.error('Failed to reject verification');
    }
  };

  const columns: ColumnsType<KYCVerification> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div>{`${record.first_name} ${record.last_name}`}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Document Type',
      dataIndex: 'document_type',
      key: 'document_type',
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors: Record<string, string> = {
          PENDING: 'orange',
          APPROVED: 'green',
          REJECTED: 'red',
          RESUBMIT_REQUESTED: 'blue',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Submitted',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedVerification(record);
              setIsModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                icon={<CheckOutlined />}
                type="primary"
                size="small"
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Button
                icon={<CloseOutlined />}
                danger
                size="small"
                onClick={() => {
                  setSelectedVerification(record);
                  setIsModalVisible(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>KYC Verification Management</h1>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type={statusFilter === undefined ? 'primary' : 'default'}
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </Button>
          <Button
            type={statusFilter === 'PENDING' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending
          </Button>
          <Button
            type={statusFilter === 'APPROVED' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('APPROVED')}
          >
            Approved
          </Button>
          <Button
            type={statusFilter === 'REJECTED' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('REJECTED')}
          >
            Rejected
          </Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={verifications}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: setPage,
          showTotal: (total) => `Total ${total} verifications`,
        }}
      />

      <Modal
        title="KYC Verification Details"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setRejectionReason('');
        }}
        footer={
          selectedVerification?.status === 'PENDING'
            ? [
                <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                  Cancel
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  onClick={() => {
                    handleApprove(selectedVerification.id);
                    setIsModalVisible(false);
                  }}
                >
                  Approve
                </Button>,
                <Button key="reject" danger onClick={handleReject}>
                  Reject
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setIsModalVisible(false)}>
                  Close
                </Button>,
              ]
        }
      >
        {selectedVerification && (
          <div>
            <p>
              <strong>User:</strong> {selectedVerification.first_name}{' '}
              {selectedVerification.last_name}
            </p>
            <p>
              <strong>Email:</strong> {selectedVerification.email}
            </p>
            <p>
              <strong>Document Type:</strong> {selectedVerification.document_type}
            </p>
            <p>
              <strong>Country:</strong> {selectedVerification.country}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <Tag
                color={
                  selectedVerification.status === 'APPROVED'
                    ? 'green'
                    : selectedVerification.status === 'REJECTED'
                    ? 'red'
                    : 'orange'
                }
              >
                {selectedVerification.status}
              </Tag>
            </p>

            {selectedVerification.status === 'PENDING' && (
              <div style={{ marginTop: 16 }}>
                <strong>Rejection Reason (if rejecting):</strong>
                <TextArea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                />
              </div>
            )}

            {selectedVerification.rejection_reason && (
              <div style={{ marginTop: 16 }}>
                <strong>Rejection Reason:</strong>
                <p>{selectedVerification.rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default KYCManagement;
