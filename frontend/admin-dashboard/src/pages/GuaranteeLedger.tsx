// ============================================
// 💰 Guarantee Ledger Module
// Read-only view of deposits, forfeitures, and resolutions
// ============================================

import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Modal,
  Descriptions,
  Divider,
  Statistic,
  Progress
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface GuaranteeTransaction {
  id: string;
  type: 'deposit' | 'forfeiture' | 'resolution' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  amount: number;
  currency: string;
  createdAt: string;
  completedAt?: string;
  
  // Transaction details
  referenceId: string;
  description: string;
  
  // Parties involved
  payer: {
    id: string;
    name: string;
    type: 'buyer' | 'seller' | 'traveler' | 'system';
  };
  
  payee: {
    id: string;
    name: string;
    type: 'buyer' | 'seller' | 'traveler' | 'system';
  };
  
  // Related entities
  relatedDispute?: {
    id: string;
    caseNumber: string;
    type: string;
  };
  
  relatedTransaction?: {
    id: string;
    amount: number;
    description: string;
  };
  
  // Audit info
  processedBy: string;
  auditId: string;
}

interface LedgerFilters {
  type?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minAmount?: number;
  maxAmount?: number;
  party?: string;
}

export default function GuaranteeLedger() {
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [selectedTransaction, setSelectedTransaction] = useState<GuaranteeTransaction | null>(null);

  // Mock data - read-only ledger entries
  const ledgerEntries: GuaranteeTransaction[] = [
    {
      id: 'gtx-001',
      type: 'deposit',
      status: 'completed',
      amount: 299.99,
      currency: 'USD',
      createdAt: '2025-12-15T10:00:00Z',
      completedAt: '2025-12-15T10:02:30Z',
      referenceId: 'DEP-2025-001',
      description: 'Purchase guarantee deposit for Wireless Headphones',
      payer: {
        id: 'user-123',
        name: 'Ahmed Mohamed',
        type: 'buyer'
      },
      payee: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      processedBy: 'system-auto',
      auditId: 'audit-001'
    },
    {
      id: 'gtx-002',
      type: 'forfeiture',
      status: 'completed',
      amount: 299.99,
      currency: 'USD',
      createdAt: '2025-12-18T14:30:00Z',
      completedAt: '2025-12-18T14:35:00Z',
      referenceId: 'FORF-2025-001',
      description: 'Guarantee forfeiture - Item not received dispute',
      payer: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      payee: {
        id: 'user-456',
        name: 'Electronics Store',
        type: 'seller'
      },
      relatedDispute: {
        id: 'disp-001',
        caseNumber: 'CASE-2025-001',
        type: 'item_not_received'
      },
      processedBy: 'admin-001',
      auditId: 'audit-002'
    },
    {
      id: 'gtx-003',
      type: 'refund',
      status: 'completed',
      amount: 150.00,
      currency: 'USD',
      createdAt: '2025-12-20T09:15:00Z',
      completedAt: '2025-12-20T09:20:00Z',
      referenceId: 'REF-2025-001',
      description: 'Partial refund - Wrong item received',
      payer: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      payee: {
        id: 'user-123',
        name: 'Ahmed Mohamed',
        type: 'buyer'
      },
      relatedDispute: {
        id: 'disp-002',
        caseNumber: 'CASE-2025-002',
        type: 'wrong_item'
      },
      processedBy: 'admin-002',
      auditId: 'audit-003'
    },
    {
      id: 'gtx-004',
      type: 'resolution',
      status: 'completed',
      amount: 500.00,
      currency: 'USD',
      createdAt: '2025-12-22T11:30:00Z',
      completedAt: '2025-12-22T11:35:00Z',
      referenceId: 'RES-2025-001',
      description: 'Dispute resolution - Split funds between parties',
      payer: {
        id: 'system',
        name: 'Mnbara Escrow',
        type: 'system'
      },
      payee: {
        id: 'multi',
        name: 'Multiple Parties',
        type: 'system'
      },
      relatedDispute: {
        id: 'disp-003',
        caseNumber: 'CASE-2025-003',
        type: 'quality_issue'
      },
      processedBy: 'admin-003',
      auditId: 'audit-004'
    }
  ];

  const columns = [
    {
      title: 'Reference ID',
      dataIndex: 'referenceId',
      key: 'referenceId',
      width: 120,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeConfig = {
          deposit: { color: 'blue', text: 'Deposit' },
          forfeiture: { color: 'red', text: 'Forfeiture' },
          resolution: { color: 'green', text: 'Resolution' },
          refund: { color: 'orange', text: 'Refund' },
        };
        const config = typeConfig[type as keyof typeof typeConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number, record: GuaranteeTransaction) => (
        <Text strong>
          {amount.toLocaleString('en-US', {
            style: 'currency',
            currency: record.currency,
          })}
        </Text>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Payer',
      dataIndex: 'payer',
      key: 'payer',
      width: 120,
      render: (payer: any) => (
        <div>
          <div>{payer.name}</div>
          <Tag size="small" color={payer.type === 'buyer' ? 'green' : payer.type === 'seller' ? 'orange' : 'blue'}>
            {payer.type}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Payee',
      dataIndex: 'payee',
      key: 'payee',
      width: 120,
      render: (payee: any) => (
        <div>
          <div>{payee.name}</div>
          <Tag size="small" color={payee.type === 'buyer' ? 'green' : payee.type === 'seller' ? 'orange' : 'blue'}>
            {payee.type}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          completed: { color: 'green', text: 'Completed' },
          pending: { color: 'blue', text: 'Pending' },
          failed: { color: 'red', text: 'Failed' },
          reversed: { color: 'orange', text: 'Reversed' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: GuaranteeTransaction) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedTransaction(record)}
        />
      ),
    },
  ];

  const getStats = () => {
    const totalAmount = ledgerEntries.reduce((sum, tx) => sum + tx.amount, 0);
    const completedCount = ledgerEntries.filter(tx => tx.status === 'completed').length;
    const disputeRelated = ledgerEntries.filter(tx => tx.relatedDispute).length;
    
    return {
      totalAmount,
      completedCount,
      disputeRelated,
      successRate: (completedCount / ledgerEntries.length) * 100
    };
  };

  const stats = getStats();

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <SafetyCertificateOutlined style={{ marginRight: 12 }} />
        Guarantee Ledger
      </Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <Card size="small">
            <Statistic
              title="Total Guarantee Value"
              value={stats.totalAmount}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Statistic
              title="Completed Transactions"
              value={stats.completedCount}
              suffix={`/ ${ledgerEntries.length}`}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <Statistic
              title="Dispute-Related"
              value={stats.disputeRelated}
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text>Success Rate</Text>
              <Progress
                type="circle"
                percent={Math.round(stats.successRate)}
                size={60}
                style={{ marginTop: 8 }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card 
        title={
          <Space>
            <FilterOutlined />
            Filters
          </Space>
        }
        style={{ marginBottom: 24 }}
        size="small"
      >
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Select
              placeholder="Transaction Type"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({ ...filters, type: value })}
            >
              <Option value="deposit">Deposit</Option>
              <Option value="forfeiture">Forfeiture</Option>
              <Option value="resolution">Resolution</Option>
              <Option value="refund">Refund</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="failed">Failed</Option>
              <Option value="reversed">Reversed</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilters({
                    ...filters,
                    dateRange: {
                      start: dates[0].toISOString(),
                      end: dates[1].toISOString(),
                    },
                  });
                }
              }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Input
              placeholder="Search description..."
              prefix={<SearchOutlined />}
              onChange={(e) => {
                // Implement search logic
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Ledger Table */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            Guarantee Transactions
            <Tag>{ledgerEntries.length}</Tag>
          </Space>
        }
        extra={
          <Button icon={<DownloadOutlined />} size="small">
            Export CSV
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={ledgerEntries}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Transaction Detail Modal */}
      <Modal
        title="Transaction Details"
        open={!!selectedTransaction}
        onCancel={() => setSelectedTransaction(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedTransaction(null)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedTransaction && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Reference ID">
              {selectedTransaction.referenceId}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={
                selectedTransaction.type === 'deposit' ? 'blue' :
                selectedTransaction.type === 'forfeiture' ? 'red' :
                selectedTransaction.type === 'resolution' ? 'green' : 'orange'
              }>
                {selectedTransaction.type.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong>
                {selectedTransaction.amount.toLocaleString('en-US', {
                  style: 'currency',
                  currency: selectedTransaction.currency,
                })}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedTransaction.description}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={
                selectedTransaction.status === 'completed' ? 'green' :
                selectedTransaction.status === 'pending' ? 'blue' :
                selectedTransaction.status === 'failed' ? 'red' : 'orange'
              }>
                {selectedTransaction.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(selectedTransaction.createdAt).toLocaleString()}
            </Descriptions.Item>
            {selectedTransaction.completedAt && (
              <Descriptions.Item label="Completed">
                {new Date(selectedTransaction.completedAt).toLocaleString()}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Payer">
              <div>
                <strong>{selectedTransaction.payer.name}</strong>
                <br />
                <Tag size="small" color={
                  selectedTransaction.payer.type === 'buyer' ? 'green' :
                  selectedTransaction.payer.type === 'seller' ? 'orange' : 'blue'
                }>
                  {selectedTransaction.payer.type}
                </Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Payee">
              <div>
                <strong>{selectedTransaction.payee.name}</strong>
                <br />
                <Tag size="small" color={
                  selectedTransaction.payee.type === 'buyer' ? 'green' :
                  selectedTransaction.payee.type === 'seller' ? 'orange' : 'blue'
                }>
                  {selectedTransaction.payee.type}
                </Tag>
              </div>
            </Descriptions.Item>
            {selectedTransaction.relatedDispute && (
              <>
                <Divider />
                <Descriptions.Item label="Related Dispute">
                  <div>
                    <strong>Case: {selectedTransaction.relatedDispute.caseNumber}</strong>
                    <br />
                    <Tag>{selectedTransaction.relatedDispute.type}</Tag>
                  </div>
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Processed By">
              {selectedTransaction.processedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Audit ID">
              <Tag>{selectedTransaction.auditId}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}