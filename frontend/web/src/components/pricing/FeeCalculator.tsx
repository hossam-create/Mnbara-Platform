import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Divider,
  Statistic,
  Table,
  Space,
  Spin,
  message,
} from 'antd';
import { DollarOutlined, CalculatorOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

interface FeeBreakdown {
  subtotal: number;
  platformFee: number;
  paymentProcessingFee: number;
  shippingFee: number;
  tax: number;
  total: number;
  breakdown: {
    label: string;
    amount: number;
    percentage?: number;
  }[];
}

interface FeeCalculatorProps {
  onFeeChange?: (fees: FeeBreakdown) => void;
  showSellerEarnings?: boolean;
}

/**
 * Fee Calculator Component
 * Requirements: TRN-003
 */
export const FeeCalculator: React.FC<FeeCalculatorProps> = ({
  onFeeChange,
  showSellerEarnings = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [sellerEarnings, setSellerEarnings] = useState<number | null>(null);

  /**
   * Calculate fees
   * Requirements: TRN-003
   */
  const calculateFees = async (values: any) => {
    try {
      setLoading(true);

      const response = await api.post('/fees/calculate', {
        itemPrice: values.itemPrice,
        quantity: values.quantity || 1,
        shippingCost: values.shippingCost,
        taxRate: values.taxRate ? values.taxRate / 100 : undefined,
        paymentMethod: values.paymentMethod,
      });

      setFeeBreakdown(response.data);
      onFeeChange?.(response.data);

      // Calculate seller earnings if needed
      if (showSellerEarnings) {
        const earningsResponse = await api.post('/fees/seller-earnings', {
          itemPrice: values.itemPrice,
          quantity: values.quantity || 1,
        });
        setSellerEarnings(earningsResponse.data.totalEarnings);
      }

      message.success('Fees calculated');
    } catch (error) {
      message.error('Failed to calculate fees');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form value changes
   * Requirements: TRN-003
   */
  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (allValues.itemPrice && allValues.itemPrice > 0) {
      calculateFees(allValues);
    }
  };

  return (
    <Spin spinning={loading}>
      <Card title={<CalculatorOutlined style={{ marginRight: '8px' }} />}>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Item Price"
                name="itemPrice"
                rules={[
                  { required: true, message: 'Item price required' },
                  {
                    pattern: /^\d+(\.\d{1,2})?$/,
                    message: 'Valid price required',
                  },
                ]}
              >
                <InputNumber
                  prefix="$"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Quantity" name="quantity" initialValue={1}>
                <InputNumber min={1} step={1} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item label="Shipping Cost (Optional)" name="shippingCost">
                <InputNumber
                  prefix="$"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Tax Rate (Optional)" name="taxRate">
                <InputNumber
                  suffix="%"
                  placeholder="8"
                  min={0}
                  max={100}
                  step={0.1}
                  precision={2}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Payment Method" name="paymentMethod">
            <Select placeholder="Select payment method">
              <Select.Option value="card">Credit/Debit Card</Select.Option>
              <Select.Option value="paypal">PayPal</Select.Option>
              <Select.Option value="wallet">Wallet</Select.Option>
            </Select>
          </Form.Item>
        </Form>

        {feeBreakdown && (
          <>
            <Divider />

            <Row gutter={16} style={{ marginBottom: '20px' }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Subtotal"
                  value={feeBreakdown.subtotal}
                  prefix="$"
                  precision={2}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Fees"
                  value={
                    feeBreakdown.platformFee +
                    feeBreakdown.paymentProcessingFee +
                    feeBreakdown.shippingFee +
                    feeBreakdown.tax
                  }
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total"
                  value={feeBreakdown.total}
                  prefix="$"
                  precision={2}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              </Col>
              {showSellerEarnings && sellerEarnings !== null && (
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Your Earnings"
                    value={sellerEarnings}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              )}
            </Row>

            <Divider />

            <h4>Fee Breakdown</h4>
            <Table
              dataSource={feeBreakdown.breakdown}
              columns={[
                {
                  title: 'Fee Type',
                  dataIndex: 'label',
                  key: 'label',
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => `$${amount.toFixed(2)}`,
                  align: 'right' as const,
                },
                {
                  title: 'Percentage',
                  dataIndex: 'percentage',
                  key: 'percentage',
                  render: (percentage) =>
                    percentage ? `${percentage.toFixed(2)}%` : '-',
                  align: 'right' as const,
                },
              ]}
              pagination={false}
              size="small"
            />
          </>
        )}
      </Card>
    </Spin>
  );
};

export default FeeCalculator;
