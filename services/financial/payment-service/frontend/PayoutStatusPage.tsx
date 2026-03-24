import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText,
  Download,
  Calendar,
  DollarSign,
  User,
  Building
} from 'lucide-react';

interface PayoutRequest {
  id: string;
  requestId: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  status: 'requested' | 'under_review' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled';
  requestedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  processedAt?: string;
  paidAt?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  rejectionReason?: string;
  batchId?: string;
  transactionReference?: string;
}

interface PayoutStatusPageProps {
  sellerId: string;
}

const PayoutStatusPage: React.FC<PayoutStatusPageProps> = ({ sellerId }) => {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, [sellerId]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manual-payouts/sellers/${sellerId}/requests`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payout requests');
      }
      
      const data = await response.json();
      setPayouts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Requested';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'processing':
        return 'Processing';
      case 'paid':
        return 'Paid';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  const downloadReceipt = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/manual-payouts/requests/${payoutId}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payout-receipt-${payoutId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payout Status</h1>
          <p className="text-gray-600">Track your payout requests and payment history</p>
        </div>
        <Button onClick={fetchPayouts} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Requested</p>
                <p className="text-lg font-semibold">
                  ${payouts.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-lg font-semibold">
                  ${payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netAmount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-lg font-semibold">
                  ${payouts.filter(p => ['requested', 'under_review', 'approved', 'processing'].includes(p.status))
                    .reduce((sum, p) => sum + p.netAmount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-lg font-semibold">{payouts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payout requests found</p>
              <p className="text-sm text-gray-500">Submit your first payout request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.id} className="border rounded-lg p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(payout.status)}
                      <div>
                        <p className="font-semibold">{payout.requestId}</p>
                        <p className="text-sm text-gray-600">
                          Requested on {formatDate(payout.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(payout.status)}>
                        {getStatusText(payout.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Amount Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Requested Amount</p>
                      <p className="font-semibold">${payout.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Processing Fee</p>
                      <p className="font-semibold">${payout.feeAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Amount</p>
                      <p className="font-semibold text-green-600">${payout.netAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Account Holder:</span>
                        <span className="font-medium">{payout.bankAccountName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Account Number:</span>
                        <span className="font-medium">{maskAccountNumber(payout.bankAccountNumber)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Bank:</span>
                        <span className="font-medium">{payout.bankName}</span>
                      </div>
                      {payout.transactionReference && (
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Reference:</span>
                          <span className="font-medium">{payout.transactionReference}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Timeline:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Requested:</span>
                        <p>{formatDate(payout.requestedAt)}</p>
                      </div>
                      {payout.reviewedAt && (
                        <div>
                          <span className="text-gray-600">Reviewed:</span>
                          <p>{formatDate(payout.reviewedAt)}</p>
                        </div>
                      )}
                      {payout.approvedAt && (
                        <div>
                          <span className="text-gray-600">Approved:</span>
                          <p>{formatDate(payout.approvedAt)}</p>
                        </div>
                      )}
                      {payout.paidAt && (
                        <div>
                          <span className="text-gray-600">Paid:</span>
                          <p>{formatDate(payout.paidAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {payout.rejectionReason && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Rejection Reason:</strong> {payout.rejectionReason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {payout.status === 'paid' && (
                      <Button
                        onClick={() => downloadReceipt(payout.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutStatusPage;
