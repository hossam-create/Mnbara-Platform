import React from 'react';
import { Card, Row, Col, Statistic, Alert, Divider, Tag, Space } from 'antd';
import { InfoCircleOutlined, DollarOutlined } from '@ant-design/icons';

interface FeeBreakdownDisplayProps {
  itemPrice: number;
  platformFee: number;
  paymentProcessingFee: number;
  shippingFee?: number;
  tax?: number;
  total: number;
  showSellerInfo?: boolean;
  sellerEarnings?: number;
}

/**
 * Fee Breakdown Display Component
 * Requirements: TRN-004
 */
export const FeeBreakdownDisplay: React.FC<FeeBreakdownDisplayProps> = ({
  itemPrice,
  platformFee,
  paymentProcessingFee,
  shippingFee = 0,
  tax = 0,
  total,
  showSellerInfo = false,
  sellerEarnings,
}) => {
  const totalFees = platformFee + paymentProcessingFee + shippingFee + tax;
  const feePercentage = (totalFees / itemPrice) * 100;

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span>Fee Breakdown</span>
        </Space>
      }
      size="small"
    >
      <Alert
        message="Transparent Pricing"
        description="See exactly how your fees are calculated. No hidden charges."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Item Price"
            value={itemPrice}
            prefix="$"
            precision={2}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Platform Fee"
            value={platformFee}
            prefix="$"
            precision={2}
            suffix={`(${((platformFee / itemPrice) * 100).toFixed(1)}%)`}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Payment Processing"
            value={paymentProcessingFee}
            prefix="$"
            precision={2}
          />
        </Col>
        {shippingFee > 0 && (
          <Col xs={12} sm={6}>
            <Statistic
              title="Shipping"
              value={shippingFee}
              prefix="$"
              precision={2}
            />
          </Col>
        )}
        {tax > 0 && (
          <Col xs={12} sm={6}>
            <Statistic
              title="Tax"
              value={tax}
              prefix="$"
              precision={2}
              suffix={`(${((tax / (itemPrice + totalFees - tax)) * 100).toFixed(1)}%)`}
            />
          </Col>
        )}
      </Row>

      <Divider />

      <Row gutter={16}>
        <Col xs={12}>
          <Statistic
            title="Total Fees"
            value={totalFees}
            prefix="$"
            precision={2}
            valueStyle={{ color: '#ff4d4f' }}
            suffix={`(${feePercentage.toFixed(1)}%)`}
          />
        </Col>
        <Col xs={12}>
          <Statistic
            title="Total Price"
            value={total}
            prefix="$"
            precision={2}
            valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: 'bold' }}
          />
        </Col>
      </Row>

      {showSellerInfo && sellerEarnings !== undefined && (
        <>
          <Divider />
          <Alert
            message="Seller Information"
            description={
              <div>
                <p>
                  After fees, you'll earn:{' '}
                  <Tag color="green">${sellerEarnings.toFixed(2)}</Tag>
                </p>
                <p style={{ fontSize: '12px', marginBottom: 0 }}>
                  This is what you'll receive after all platform and payment
                  processing fees.
                </p>
              </div>
            }
            type="success"
            showIcon
          />
        </>
      )}
    </Card>
  );
};

export default FeeBreakdownDisplay;
