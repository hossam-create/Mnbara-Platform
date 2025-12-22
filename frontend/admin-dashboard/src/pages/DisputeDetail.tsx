/**
 * Dispute Detail Page
 * Requirements: 12.2 - Display full order and dispute info with communication history
 * Requirements: 17.2 - Show submitted evidence from both sides
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Timeline,
  Image,
  Modal,
  Input,
  Select,
  InputNumber,
  message,
  Spin,
  Avatar,
  List,
  Divider,
  Tabs,
  Empty,
  Typography,
  Badge,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  FileImageOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  MessageOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { disputeService, Dispute, DisputeEvidence, DisputeMessage, DisputeResolutionResult } from '../services/admin.service';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const DisputeDetail = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolution, setResolution] = useState({
    outcome: 'no_action' as 'refund_buyer' | 'release_seller' | 'partial_refund' | 'no_action',
    amount: 0,
    notes: '',
  });
  const [newMessage, setNewMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [resolutionStep, setResolutionStep] = useState<'form' | 'confirm' | 'processing' | 'result'>('form');
  const [resolutionResult, setResolutionResult] = useState<DisputeResolutionResult | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    action: string;
    actorId: string;
    actorName: string;
    description: string;
    metadata: Record<string, any>;
    createdAt: string;
  }>>([]);

  const fetchDispute = useCallback(async () => {
    if (!disputeId) return;
    setLoading(true);
    try {
      const data = await disputeService.getDispute(disputeId);
      setDispute(data);
    } catch (error) {
      message.error('Failed to fetch dispute details');
      navigate('/disputes');
    } finally {
      setLoading(false);
    }
  }, [disputeId, navigate]);

  const fetchAuditLogs = useCallback(async () => {
    if (!disputeId) return;
    try {
      const response = await disputeService.getResolutionAuditLogs(disputeId);
      setAuditLogs(response.logs);
    } catch (error) {
      // Silently fail - audit logs are supplementary
      console.error('Failed to fetch audit logs:', error);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchDispute();
    fetchAuditLogs();
  }, [fetchDispute, fetchAuditLogs]);

  const handleStatusChange = async (status: string) => {
    setActionLoading(true);
    try {
      await disputeService.updateDisputeStatus(disputeId!, status);
      message.success('Status updated successfully');
      fetchDispute();
    } catch (error) {
      message.error('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.notes.trim()) {
      message.error('Please provide resolution notes');
      return;
    }
    
    // If on form step, move to confirmation
    if (resolutionStep === 'form') {
      setResolutionStep('confirm');
      return;
    }
    
    // Process the resolution
    setResolutionStep('processing');
    setActionLoading(true);
    try {
      const result = await disputeService.resolveDispute(disputeId!, resolution);
      setResolutionResult(result);
      setResolutionStep('result');
      
      // Show appropriate message based on escrow action
      if (result.escrowAction) {
        if (result.escrowAction.status === 'success') {
          message.success(`Dispute resolved. ${getEscrowActionMessage(result.escrowAction.type, result.escrowAction.amount)}`);
        } else if (result.escrowAction.status === 'failed') {
          message.warning(`Dispute resolved but escrow action failed: ${result.escrowAction.message}`);
        }
      } else {
        message.success('Dispute resolved successfully');
      }
      
      fetchDispute();
      fetchAuditLogs();
    } catch (error) {
      message.error('Failed to resolve dispute');
      setResolutionStep('form');
    } finally {
      setActionLoading(false);
    }
  };

  const getEscrowActionMessage = (type: string, amount?: number) => {
    switch (type) {
      case 'release':
        return 'Escrow funds released to seller.';
      case 'refund':
        return 'Full refund issued to buyer.';
      case 'partial_refund':
        return `Partial refund of ${formatCurrency(amount || 0)} issued to buyer.`;
      default:
        return '';
    }
  };

  const handleCloseResolveModal = () => {
    setResolveModalVisible(false);
    setResolutionStep('form');
    setResolutionResult(null);
    setResolution({ outcome: 'no_action', amount: 0, notes: '' });
  };

  const getOutcomeDescription = (outcome: string) => {
    switch (outcome) {
      case 'refund_buyer':
        return 'The full order amount will be refunded to the buyer from escrow. The seller will not receive payment.';
      case 'release_seller':
        return 'The escrow funds will be released to the seller. The buyer will not receive a refund.';
      case 'partial_refund':
        return 'A partial amount will be refunded to the buyer. The remaining amount will be released to the seller.';
      case 'no_action':
        return 'No financial action will be taken. The dispute will be marked as resolved without escrow changes.';
      default:
        return '';
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setActionLoading(true);
    try {
      await disputeService.addMessage(disputeId!, newMessage);
      setNewMessage('');
      message.success('Message sent');
      fetchDispute();
    } catch (error) {
      message.error('Failed to send message');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'under_review':
        return 'processing';
      case 'resolved':
        return 'success';
      case 'escalated':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ExclamationCircleOutlined />;
      case 'under_review':
        return <ClockCircleOutlined />;
      case 'resolved':
        return <CheckCircleOutlined />;
      case 'escalated':
        return <WarningOutlined />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'blue';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMessageAvatarColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#1890ff';
      case 'buyer':
        return '#52c41a';
      case 'seller':
        return '#faad14';
      default:
        return '#d9d9d9';
    }
  };

  // Separate evidence by party (buyer vs seller)
  const getBuyerEvidence = (): DisputeEvidence[] => {
    if (!dispute) return [];
    return dispute.evidence.filter((e) => e.uploadedBy === dispute.order.buyerId);
  };

  const getSellerEvidence = (): DisputeEvidence[] => {
    if (!dispute) return [];
    return dispute.evidence.filter((e) => e.uploadedBy === dispute.order.sellerId);
  };

  const renderEvidenceItem = (evidence: DisputeEvidence) => (
    <Card
      key={evidence.id}
      size="small"
      style={{ marginBottom: 12 }}
      hoverable
    >
      {evidence.type === 'image' ? (
        <div style={{ textAlign: 'center' }}>
          <Image
            src={evidence.url}
            width={180}
            height={120}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              mask: (
                <Space>
                  <EyeOutlined /> View
                </Space>
              ),
            }}
          />
        </div>
      ) : evidence.type === 'document' ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          <div style={{ marginTop: 8 }}>
            <a href={evidence.url} target="_blank" rel="noopener noreferrer">
              View Document
            </a>
          </div>
        </div>
      ) : (
        <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <Text>{evidence.content}</Text>
        </div>
      )}
      <div
        style={{
          fontSize: 11,
          color: '#888',
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        <ClockCircleOutlined style={{ marginRight: 4 }} />
        {formatDate(evidence.uploadedAt)}
      </div>
    </Card>
  );

  const renderEvidenceSection = (
    evidence: DisputeEvidence[],
    title: string,
    icon: React.ReactNode
  ) => (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 16,
          gap: 8,
        }}
      >
        {icon}
        <Text strong>{title}</Text>
        <Badge count={evidence.length} style={{ marginLeft: 8 }} />
      </div>
      {evidence.length > 0 ? (
        <Row gutter={[12, 12]}>
          {evidence.map((e) => (
            <Col xs={24} sm={12} md={8} key={e.id}>
              {renderEvidenceItem(e)}
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No evidence submitted"
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading dispute details...</div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Empty description="Dispute not found" />
        <Button
          type="primary"
          onClick={() => navigate('/disputes')}
          style={{ marginTop: 16 }}
        >
          Back to Disputes
        </Button>
      </div>
    );
  }

  const buyerEvidence = getBuyerEvidence();
  const sellerEvidence = getSellerEvidence();

  const evidenceTabItems = [
    {
      key: 'buyer',
      label: (
        <span>
          <UserOutlined style={{ color: '#52c41a' }} /> Buyer Evidence ({buyerEvidence.length})
        </span>
      ),
      children: renderEvidenceSection(
        buyerEvidence,
        'Evidence from Buyer',
        <UserOutlined style={{ color: '#52c41a', fontSize: 18 }} />
      ),
    },
    {
      key: 'seller',
      label: (
        <span>
          <ShopOutlined style={{ color: '#faad14' }} /> Seller Evidence ({sellerEvidence.length})
        </span>
      ),
      children: renderEvidenceSection(
        sellerEvidence,
        'Evidence from Seller',
        <ShopOutlined style={{ color: '#faad14', fontSize: 18 }} />
      ),
    },
    {
      key: 'timeline',
      label: (
        <span>
          <ClockCircleOutlined /> Timeline View ({dispute.evidence.length + dispute.messages.length})
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>Complete Activity Timeline</Text>
            <Tag color="blue">{dispute.evidence.length} evidence items</Tag>
            <Tag color="green">{dispute.messages.length} messages</Tag>
          </div>
          
          <Timeline
            items={[
              // Dispute creation
              {
                color: 'red',
                dot: <ExclamationCircleOutlined style={{ fontSize: 16 }} />,
                children: (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Tag color="red">DISPUTE CREATED</Tag>
                        <Text strong style={{ marginLeft: 8 }}>
                          {dispute.reason}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatDate(dispute.createdAt)}
                      </Text>
                    </div>
                    <div style={{ marginTop: 8, color: '#666' }}>
                      {dispute.description}
                    </div>
                  </div>
                ),
              },
              // Combine evidence and messages in chronological order
              ...[...dispute.evidence, ...dispute.messages]
                .sort((a, b) => new Date(a.createdAt || a.uploadedAt).getTime() - new Date(b.createdAt || b.uploadedAt).getTime())
                .map((item) => {
                  if ('message' in item) {
                    // Message item
                    return {
                      color: item.senderRole === 'admin' ? 'blue' : 'gray',
                      dot: <MessageOutlined style={{ fontSize: 14 }} />,
                      children: (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <Tag color={item.senderRole === 'admin' ? 'blue' : item.senderRole === 'buyer' ? 'green' : 'orange'}>
                                {item.senderRole.toUpperCase()}
                              </Tag>
                              <Text strong style={{ marginLeft: 8 }}>
                                {item.senderName}
                              </Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDate(item.createdAt)}
                            </Text>
                          </div>
                          <div style={{ 
                            marginTop: 8, 
                            padding: 12, 
                            background: item.senderRole === 'admin' ? '#e6f7ff' : '#fafafa',
                            borderRadius: 6,
                            border: '1px solid #d9d9d9'
                          }}>
                            {item.message}
                          </div>
                        </div>
                      ),
                    };
                  } else {
                    // Evidence item
                    return {
                      color: item.uploadedBy === dispute.order.buyerId ? 'green' : 'orange',
                      dot: item.type === 'image' ? <FileImageOutlined /> : <FileTextOutlined />,
                      children: (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <Tag color={item.uploadedBy === dispute.order.buyerId ? 'green' : 'orange'}>
                                {item.uploadedBy === dispute.order.buyerId ? 'BUYER' : 'SELLER'}
                              </Tag>
                              <Text strong style={{ marginLeft: 8 }}>
                                {item.type.toUpperCase()} EVIDENCE
                              </Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDate(item.uploadedAt)}
                            </Text>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {renderEvidenceItem(item)}
                          </div>
                        </div>
                      ),
                    };
                  }
                })
            ]}
          />
        </div>
      ),
    },
    {
      key: 'analysis',
      label: (
        <span>
          <FileTextOutlined /> Analysis View
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Evidence Analysis Summary</Text>
          </div>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card size="small" title="Buyer Evidence Summary" bordered={false}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {buyerEvidence.length}
                  </div>
                  <Text type="secondary">Items Submitted</Text>
                  
                  {buyerEvidence.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Evidence Types:</Text>
                      <div style={{ marginTop: 8 }}>
                        {Object.entries(
                          buyerEvidence.reduce((acc, e) => {
                            acc[e.type] = (acc[e.type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text>{type.charAt(0).toUpperCase() + type.slice(1)}:</Text>
                            <Tag>{count}</Tag>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card size="small" title="Seller Evidence Summary" bordered={false}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    {sellerEvidence.length}
                  </div>
                  <Text type="secondary">Items Submitted</Text>
                  
                  {sellerEvidence.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Evidence Types:</Text>
                      <div style={{ marginTop: 8 }}>
                        {Object.entries(
                          sellerEvidence.reduce((acc, e) => {
                            acc[e.type] = (acc[e.type] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <div key={type} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text>{type.charAt(0).toUpperCase() + type.slice(1)}:</Text>
                            <Tag>{count}</Tag>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          <Card size="small" title="Timeline Analysis" bordered={false}>
            <div style={{ padding: 12 }}>
              <Text strong>Key Timeline Events:</Text>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Dispute Created:</Text>
                  <Tag>{formatDate(dispute.createdAt)}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>First Evidence:</Text>
                  <Tag>
                    {dispute.evidence.length > 0 
                      ? formatDate(dispute.evidence[0].uploadedAt)
                      : 'No evidence'
                    }
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Last Activity:</Text>
                  <Tag>{formatDate(dispute.updatedAt)}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Duration:</Text>
                  <Tag>
                    {Math.ceil((new Date(dispute.updatedAt).getTime() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                  </Tag>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/disputes')}
        >
          Back to Disputes
        </Button>
        <Space>
          <Tag
            color={getStatusColor(dispute.status)}
            icon={getStatusIcon(dispute.status)}
            style={{ fontSize: 14, padding: '4px 12px' }}
          >
            {dispute.status.replace('_', ' ').toUpperCase()}
          </Tag>
          <Tag
            color={getPriorityColor(dispute.priority)}
            style={{ fontSize: 14, padding: '4px 12px' }}
          >
            {dispute.priority.toUpperCase()} PRIORITY
          </Tag>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Main Content - Left Column */}
        <Col xs={24} lg={16}>
          {/* Dispute Details Card */}
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined />
                Dispute Details
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Dispute ID">
                <Tooltip title={dispute.id}>
                  <Text copyable={{ text: dispute.id }}>
                    {dispute.id.slice(0, 12)}...
                  </Text>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {formatDate(dispute.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Raised By">
                <Space>
                  <Avatar
                    size="small"
                    src={dispute.raisedByUser?.avatarUrl}
                    icon={<UserOutlined />}
                  />
                  <span>{dispute.raisedByUser?.fullName || 'Unknown'}</span>
                  <Tag
                    color={dispute.raisedBy === 'buyer' ? 'green' : 'orange'}
                  >
                    {dispute.raisedBy.toUpperCase()}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {formatDate(dispute.updatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                <Text strong>{dispute.reason}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                <div
                  style={{
                    background: '#fafafa',
                    padding: 12,
                    borderRadius: 4,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}
                >
                  {dispute.description}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Order Information Card */}
          <Card
            title={
              <Space>
                <DollarOutlined />
                Order Information
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Order ID">
                    <Tooltip title={dispute.order.id}>
                      <Text copyable={{ text: dispute.order.id }}>
                        {dispute.order.id.slice(0, 12)}...
                      </Text>
                    </Tooltip>
                  </Descriptions.Item>
                  <Descriptions.Item label="Item">
                    <Text strong>{dispute.order.listingTitle}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount">
                    <Text
                      strong
                      style={{ fontSize: 18, color: '#1890ff' }}
                    >
                      {formatCurrency(dispute.order.amount)}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Parties Involved" bordered={false}>
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#52c41a' }}
                      />
                      <Text type="secondary">Buyer</Text>
                    </div>
                    <Text>ID: {dispute.order.buyerId.slice(0, 12)}...</Text>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Avatar
                        size="small"
                        icon={<ShopOutlined />}
                        style={{ backgroundColor: '#faad14' }}
                      />
                      <Text type="secondary">Seller</Text>
                    </div>
                    <Text>ID: {dispute.order.sellerId.slice(0, 12)}...</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Enhanced Evidence Card with Timeline */}
          <Card
            title={
              <Space>
                <FileImageOutlined />
                Evidence Timeline & Analysis
                <Badge
                  count={dispute.evidence.length}
                  style={{ marginLeft: 8 }}
              />
            }
            style={{ marginBottom: 24 }}
          >
            <Tabs 
              items={evidenceTabItems} 
              defaultActiveKey="all"
              tabBarExtraContent={
                <Button 
                  size="small" 
                  icon={<FileImageOutlined />}
                  onClick={() => {
                    // Download evidence package
                    message.info('Evidence package download initiated');
                  }}
                >
                  Export Evidence
                </Button>
              }
            />
          </Card>

          {/* Resolution Card (if resolved) */}
          {dispute.resolution && (
            <Card
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  Resolution
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label="Outcome">
                  <Tag color="success" style={{ fontSize: 14 }}>
                    {dispute.resolution.outcome.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                {dispute.resolution.amount !== undefined &&
                  dispute.resolution.amount > 0 && (
                    <Descriptions.Item label="Refund Amount">
                      <Text strong style={{ color: '#52c41a' }}>
                        {formatCurrency(dispute.resolution.amount)}
                      </Text>
                    </Descriptions.Item>
                  )}
                <Descriptions.Item label="Resolved At">
                  {formatDate(dispute.resolution.resolvedAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Resolved By">
                  {dispute.resolution.resolvedBy}
                </Descriptions.Item>
                <Descriptions.Item label="Resolution Notes" span={2}>
                  <div
                    style={{
                      background: '#f6ffed',
                      padding: 12,
                      borderRadius: 4,
                      border: '1px solid #b7eb8f',
                    }}
                  >
                    {dispute.resolution.notes}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Audit Log Card - Requirements: 12.4 - Log resolution action for audit */}
          {auditLogs.length > 0 && (
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  Audit Log
                  <Badge count={auditLogs.length} style={{ marginLeft: 8 }} />
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Timeline
                items={auditLogs.map((log) => ({
                  color: log.action.includes('RESOLVED') ? 'green' : 
                         log.action.includes('ESCROW') ? 'blue' : 
                         log.action.includes('ESCALATED') ? 'orange' : 'gray',
                  children: (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <Tag color={
                            log.action.includes('RESOLVED') ? 'success' :
                            log.action.includes('ESCROW_RELEASE') ? 'processing' :
                            log.action.includes('ESCROW_REFUND') ? 'warning' :
                            'default'
                          }>
                            {log.action.replace(/_/g, ' ')}
                          </Tag>
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            by {log.actorName}
                          </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatDate(log.createdAt)}
                        </Text>
                      </div>
                      <div style={{ marginTop: 8, color: '#666' }}>
                        {log.description}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div style={{ marginTop: 8, background: '#fafafa', padding: 8, borderRadius: 4, fontSize: 12 }}>
                          {log.metadata.outcome && (
                            <div><Text type="secondary">Outcome:</Text> {log.metadata.outcome}</div>
                          )}
                          {log.metadata.amount && (
                            <div><Text type="secondary">Amount:</Text> {formatCurrency(log.metadata.amount)}</div>
                          )}
                          {log.metadata.transactionId && (
                            <div><Text type="secondary">Transaction:</Text> {log.metadata.transactionId}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            </Card>
          )}
        </Col>

        {/* Sidebar - Right Column */}
        <Col xs={24} lg={8}>
          {/* Actions Card */}
          <Card
            title="Actions"
            style={{ marginBottom: 24 }}
            bodyStyle={{ padding: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {dispute.status === 'open' && (
                <Button
                  block
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  onClick={() => handleStatusChange('under_review')}
                  loading={actionLoading}
                >
                  Start Review
                </Button>
              )}
              {dispute.status === 'under_review' && (
                <>
                  <Button
                    block
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => setResolveModalVisible(true)}
                  >
                    Resolve Dispute
                  </Button>
                  <Button
                    block
                    danger
                    icon={<WarningOutlined />}
                    onClick={() => handleStatusChange('escalated')}
                    loading={actionLoading}
                  >
                    Escalate
                  </Button>
                </>
              )}
              {dispute.status === 'escalated' && (
                <Button
                  block
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setResolveModalVisible(true)}
                >
                  Resolve Dispute
                </Button>
              )}
              {dispute.status === 'resolved' && (
                <div style={{ textAlign: 'center', color: '#52c41a' }}>
                  <CheckCircleOutlined style={{ fontSize: 32 }} />
                  <div style={{ marginTop: 8 }}>This dispute has been resolved</div>
                </div>
              )}
            </Space>
          </Card>

          {/* Communication History Card */}
          <Card
            title={
              <Space>
                <MessageOutlined />
                Communication History
                <Badge count={dispute.messages.length} />
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <div
              style={{
                maxHeight: 450,
                overflow: 'auto',
                padding: 16,
              }}
            >
              {dispute.messages.length > 0 ? (
                <List
                  dataSource={dispute.messages}
                  renderItem={(msg: DisputeMessage) => (
                    <List.Item
                      style={{
                        padding: '12px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={
                              msg.senderRole === 'admin' ? (
                                <UserOutlined />
                              ) : msg.senderRole === 'buyer' ? (
                                <UserOutlined />
                              ) : (
                                <ShopOutlined />
                              )
                            }
                            style={{
                              backgroundColor: getMessageAvatarColor(
                                msg.senderRole
                              ),
                            }}
                          />
                        }
                        title={
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Space size="small">
                              <Text strong>{msg.senderName}</Text>
                              <Tag
                                color={
                                  msg.senderRole === 'admin'
                                    ? 'blue'
                                    : msg.senderRole === 'buyer'
                                    ? 'green'
                                    : 'orange'
                                }
                                style={{ fontSize: 10 }}
                              >
                                {msg.senderRole.toUpperCase()}
                              </Tag>
                            </Space>
                          </div>
                        }
                        description={
                          <>
                            <div
                              style={{
                                background:
                                  msg.senderRole === 'admin'
                                    ? '#e6f7ff'
                                    : '#fafafa',
                                padding: '8px 12px',
                                borderRadius: 8,
                                marginTop: 4,
                              }}
                            >
                              {msg.message}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: '#888',
                                marginTop: 4,
                              }}
                            >
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {formatDate(msg.createdAt)}
                            </div>
                          </>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No messages yet"
                />
              )}
            </div>

            {/* Message Input */}
            {dispute.status !== 'resolved' && (
              <div
                style={{
                  padding: 16,
                  borderTop: '1px solid #f0f0f0',
                  background: '#fafafa',
                }}
              >
                <TextArea
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to both parties..."
                  style={{ marginBottom: 8 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={actionLoading}
                  disabled={!newMessage.trim()}
                  block
                >
                  Send Message
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Resolve Dispute Modal - Multi-step with confirmation */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            {resolutionStep === 'form' && 'Resolve Dispute'}
            {resolutionStep === 'confirm' && 'Confirm Resolution'}
            {resolutionStep === 'processing' && 'Processing Resolution'}
            {resolutionStep === 'result' && 'Resolution Complete'}
          </Space>
        }
        open={resolveModalVisible}
        onCancel={handleCloseResolveModal}
        footer={
          resolutionStep === 'result' ? (
            <Button type="primary" onClick={handleCloseResolveModal}>
              Close
            </Button>
          ) : resolutionStep === 'processing' ? null : (
            <Space>
              {resolutionStep === 'confirm' && (
                <Button onClick={() => setResolutionStep('form')}>
                  Back
                </Button>
              )}
              <Button onClick={handleCloseResolveModal}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleResolve}
                loading={actionLoading}
                danger={resolution.outcome === 'refund_buyer'}
              >
                {resolutionStep === 'form' ? 'Continue' : 'Confirm & Execute'}
              </Button>
            </Space>
          )
        }
        width={560}
      >
        {/* Step 1: Resolution Form */}
        {resolutionStep === 'form' && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
              <Text strong>Order Amount:</Text>
              <Text style={{ marginLeft: 8, fontSize: 18, color: '#1890ff' }}>
                {formatCurrency(dispute.order.amount)}
              </Text>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Resolution Outcome: <Text type="danger">*</Text>
              </Text>
              <Select
                value={resolution.outcome}
                onChange={(v) => setResolution((p) => ({ ...p, outcome: v, amount: v === 'partial_refund' ? Math.floor(dispute.order.amount / 2) : 0 }))}
                style={{ width: '100%' }}
                size="large"
              >
                <Option value="refund_buyer">
                  <Space>
                    <UserOutlined style={{ color: '#52c41a' }} />
                    Full Refund to Buyer
                  </Space>
                </Option>
                <Option value="release_seller">
                  <Space>
                    <ShopOutlined style={{ color: '#faad14' }} />
                    Release Payment to Seller
                  </Space>
                </Option>
                <Option value="partial_refund">
                  <Space>
                    <DollarOutlined style={{ color: '#1890ff' }} />
                    Partial Refund
                  </Space>
                </Option>
                <Option value="no_action">
                  <Space>
                    <ExclamationCircleOutlined />
                    No Action Required
                  </Space>
                </Option>
              </Select>
              <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                {getOutcomeDescription(resolution.outcome)}
              </div>
            </div>

            {resolution.outcome === 'partial_refund' && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Refund Amount to Buyer:
                </Text>
                <InputNumber
                  value={resolution.amount}
                  onChange={(v) =>
                    setResolution((p) => ({ ...p, amount: v || 0 }))
                  }
                  prefix="$"
                  style={{ width: '100%' }}
                  size="large"
                  min={0.01}
                  max={dispute.order.amount - 0.01}
                  step={0.01}
                />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 12 }}>
                  <span>Buyer receives: {formatCurrency(resolution.amount)}</span>
                  <span>Seller receives: {formatCurrency(dispute.order.amount - resolution.amount)}</span>
                </div>
              </div>
            )}

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Resolution Notes: <Text type="danger">*</Text>
              </Text>
              <TextArea
                rows={4}
                value={resolution.notes}
                onChange={(e) =>
                  setResolution((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Provide detailed notes about the resolution decision. This will be logged for audit purposes..."
                maxLength={1000}
                showCount
              />
            </div>
          </Space>
        )}

        {/* Step 2: Confirmation */}
        {resolutionStep === 'confirm' && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ background: '#fff7e6', padding: 16, borderRadius: 8, border: '1px solid #ffd591' }}>
              <Space>
                <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
                <Text strong>Please review and confirm the resolution action</Text>
              </Space>
            </div>

            <Card size="small" title="Resolution Summary">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Outcome">
                  <Tag color={
                    resolution.outcome === 'refund_buyer' ? 'green' :
                    resolution.outcome === 'release_seller' ? 'orange' :
                    resolution.outcome === 'partial_refund' ? 'blue' : 'default'
                  }>
                    {resolution.outcome.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                {resolution.outcome === 'refund_buyer' && (
                  <Descriptions.Item label="Refund to Buyer">
                    <Text strong style={{ color: '#52c41a' }}>{formatCurrency(dispute.order.amount)}</Text>
                  </Descriptions.Item>
                )}
                {resolution.outcome === 'release_seller' && (
                  <Descriptions.Item label="Release to Seller">
                    <Text strong style={{ color: '#faad14' }}>{formatCurrency(dispute.order.amount)}</Text>
                  </Descriptions.Item>
                )}
                {resolution.outcome === 'partial_refund' && (
                  <>
                    <Descriptions.Item label="Refund to Buyer">
                      <Text strong style={{ color: '#52c41a' }}>{formatCurrency(resolution.amount)}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Release to Seller">
                      <Text strong style={{ color: '#faad14' }}>{formatCurrency(dispute.order.amount - resolution.amount)}</Text>
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="Notes">
                  <div style={{ maxHeight: 100, overflow: 'auto' }}>{resolution.notes}</div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <div style={{ background: '#f6ffed', padding: 12, borderRadius: 8, border: '1px solid #b7eb8f' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                This action will be logged for audit purposes. The escrow funds will be processed automatically based on the selected outcome.
              </Text>
            </div>
          </Space>
        )}

        {/* Step 3: Processing */}
        {resolutionStep === 'processing' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Processing resolution and escrow action...</Text>
            </div>
            <div style={{ marginTop: 8, color: '#888' }}>
              <Text type="secondary">Please do not close this window</Text>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {resolutionStep === 'result' && resolutionResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ textAlign: 'center', padding: 20 }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 18 }}>Dispute Resolved Successfully</Text>
              </div>
            </div>

            <Card size="small" title="Resolution Details">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Outcome">
                  <Tag color="success">
                    {resolutionResult.dispute.resolution?.outcome.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Resolved At">
                  {resolutionResult.dispute.resolution?.resolvedAt && formatDate(resolutionResult.dispute.resolution.resolvedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {resolutionResult.escrowAction && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <DollarOutlined />
                    Escrow Action
                  </Space>
                }
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Action Type">
                    <Tag color={resolutionResult.escrowAction.status === 'success' ? 'success' : 'error'}>
                      {resolutionResult.escrowAction.type.replace(/_/g, ' ').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {resolutionResult.escrowAction.status === 'success' ? (
                      <Text type="success"><CheckCircleOutlined /> Completed</Text>
                    ) : (
                      <Text type="danger"><ExclamationCircleOutlined /> {resolutionResult.escrowAction.message}</Text>
                    )}
                  </Descriptions.Item>
                  {resolutionResult.escrowAction.transactionId && (
                    <Descriptions.Item label="Transaction ID">
                      <Text copyable={{ text: resolutionResult.escrowAction.transactionId }}>
                        {resolutionResult.escrowAction.transactionId.slice(0, 16)}...
                      </Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {resolutionResult.auditLogId && (
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Audit Log ID: {resolutionResult.auditLogId}
                </Text>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default DisputeDetail;
