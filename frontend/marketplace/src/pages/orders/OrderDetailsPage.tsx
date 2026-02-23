import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import disputeService from '../../services/disputeService';
import { Dispute } from '../../services/disputeService';
import { apiService } from '@/services/api.service';
import DisputeTimeline from '../../components/disputes/DisputeTimeline';
import DisputeMessages from '../../components/disputes/DisputeMessages';
import DisputeSummary from '../../components/disputes/DisputeSummary';
import EvidencePanel from '../../components/disputes/EvidencePanel';
import DisputeActionPanel from '../../components/disputes/DisputeActionPanel';
import GuaranteeStatusBadge from '../../components/guarantees/GuaranteeStatusBadge';
import GuaranteeBadge from '../../components/guarantee/GuaranteeBadge';
import DisputeStatusBadge from '../../components/disputes/DisputeStatusBadge';
import DisputeMessageBox from '../../components/disputes/DisputeMessageBox';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  seller: {
    name: string;
    id: string;
  };
  buyer: {
    name: string;
    id: string;
  };
  escrowId?: string;
  escrowStatus?: 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED';
}

const getEscrowReasonLabel = (referenceType: string): string => {
  switch (referenceType) {
    case 'ORDER':
      return 'Purchase';
    case 'AUCTION':
      return 'Auction Win';
    case 'MANUAL':
      return 'Manual Escrow';
    default:
      return 'Escrow';
  }
};

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [escrow, setEscrow] = useState<any>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderAndEscrow(orderId);
    }
  }, [orderId]);

  const loadOrderAndEscrow = async (orderId: string) => {
    try {
      setLoading(true);
      
      // Load escrow data for this order
      try {
        const escrowResponse = await apiService.escrow.getByOrder(orderId);
        const escrowData = escrowResponse.data.data;
        
        // Map escrow data to order structure
        const orderFromEscrow: Order = {
          id: orderId,
          status: escrowData.status === 'DISPUTED' ? 'DISPUTED' : 
                  escrowData.status === 'RELEASED' ? 'DELIVERED' : 
                  escrowData.status === 'REFUNDED' ? 'CANCELLED' : 'PROCESSING',
          totalAmount: Number(escrowData.amount) / 100,
          currency: escrowData.currency,
          createdAt: escrowData.createdAt,
          items: escrowData.order?.items || [{
            name: escrowData.description || 'Order Item',
            quantity: 1,
            price: Number(escrowData.amount) / 100
          }],
          seller: {
            name: 'Seller',
            id: escrowData.sellerId
          },
          buyer: {
            name: 'Buyer',
            id: escrowData.buyerId
          },
          escrowId: escrowData.id,
          escrowStatus: escrowData.status
        };
        
        setOrder(orderFromEscrow);
        setEscrow(escrowData);
      } catch (escrowError) {
        console.error('Failed to load escrow:', escrowError);
        // Fallback to mock data if escrow not found
        setOrder({
          id: orderId,
          status: 'PROCESSING',
          totalAmount: 0,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          items: [],
          seller: { name: 'Unknown', id: 'unknown' },
          buyer: { name: 'Unknown', id: 'unknown' }
        });
      }
      
      // Load dispute data
      try {
        const disputeData = await disputeService.getDisputeByOrderId(orderId);
        setDispute(disputeData);
      } catch (disputeError) {
        console.error('Failed to load dispute:', disputeError);
      }
    } catch (err) {
      console.error('Failed to load order and escrow:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'DISPUTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
                <Link
                  to="/orders"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Orders
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  Order Details
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                  {order.status}
                </div>
                
                {/* Guarantee Status Badge - now reflects actual escrow status */}
                {escrow && (
                  <GuaranteeStatusBadge 
                    status={order.escrowStatus === 'DISPUTED' ? 'DISPUTE' : order.escrowStatus === 'RELEASED' ? 'RELEASED' : 'HELD'}
                  />
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* MNbarh Guarantee Badge - now reflects actual escrow status */}
              <div className="mb-4">
                {escrow && (
                  <GuaranteeBadge 
                    level="full" 
                    escrowStatus={order.escrowStatus || 'HELD'}
                    size="medium"
                    className="w-full"
                  />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">
                    {order.currency} {order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">
                        {order.currency} {item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parties */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Parties</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Buyer</p>
                    <p className="font-medium">{order.buyer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Seller</p>
                    <p className="font-medium">{order.seller.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Escrow Information - now reflects actual escrow status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">MNbarh Guarantee</h3>
              <p className="text-sm text-blue-700">
                {escrow ? (
                  escrow.status === 'DISPUTED' 
                    ? 'Funds are currently held in escrow due to an ongoing dispute. Resolution will be handled by our dispute resolution team.'
                    : escrow.status === 'RELEASED'
                    ? 'Funds have been released to the seller. Your purchase is protected by MNbarh Guarantee.'
                    : escrow.status === 'REFUNDED'
                    ? 'Funds have been refunded to your wallet. Your purchase is protected by MNbarh Guarantee.'
                    : 'Funds are securely held in escrow until order completion. Your purchase is protected by MNbarh Guarantee.'
                ) : (
                  'Loading escrow information...'
                )}
              </p>
              {escrow && (
                <div className="mt-2 text-xs text-blue-600">
                  <p>Escrow ID: {escrow.id}</p>
                  <p>Reason: {getEscrowReasonLabel(escrow.referenceType)}</p>
                </div>
              )}
            </div>

            {/* Dispute UI - Only show if dispute exists */}
            {dispute && (
              <div className="space-y-6">
                {/* Order Issue / Dispute Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Issue / Dispute</h3>
                  
                  {/* Dispute Status Badge */}
                  <div className="mb-4">
                    <DisputeStatusBadge status={dispute.status} />
                  </div>
                  
                  {/* Reassurance Message */}
                  <DisputeMessageBox
                    title="Case Under Review"
                    message="MNbarh is reviewing this case to protect both parties."
                    icon="🛡️"
                    variant="info"
                  />
                </div>

                {/* Dispute Action Panel */}
                <DisputeActionPanel 
                  dispute={dispute}
                  userRole="BUYER"
                  orderId={order.id}
                  escrowId={order.escrowId}
                  onDisputeSubmit={async (newDispute) => {
                    setDispute(newDispute);
                    // Reload order data to reflect dispute status
                    await loadOrderAndEscrow(orderId);
                  }}
                />

                {/* Dispute Components */}
                <DisputeSummary dispute={dispute} />
                <DisputeTimeline dispute={dispute} />
                <DisputeMessages dispute={dispute} />
                <EvidencePanel dispute={dispute} />
              </div>
            )}

            {/* No Dispute - Show Action Panel */}
            {!dispute && !loading && (
              <div className="space-y-6">
                {/* Dispute Action Panel for creating new dispute */}
                <DisputeActionPanel 
                  dispute={null}
                  userRole="BUYER"
                  orderId={order.id}
                  escrowId={order.escrowId}
                  onDisputeSubmit={async (newDispute) => {
                    setDispute(newDispute);
                    // Reload order data to reflect dispute status
                    await loadOrderAndEscrow(orderId);
                  }}
                />
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-medium text-green-900">No Active Dispute</h3>
                      <p className="text-sm text-green-800 mt-1">
                        This order does not have any active disputes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Contact Support
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Download Invoice
                </button>
                {dispute && dispute.status !== 'RESOLVED' && (
                  <button className="w-full px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors">
                    View Dispute Policy
                  </button>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-4">Need Help?</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Check our FAQ for common questions</p>
                <p>• Contact support for order issues</p>
                <p>• Review our return policy</p>
                <p>• Track your shipment status</p>
              </div>
              <button className="mt-4 text-brand-blue hover:underline text-sm">
                Visit Help Center →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
