import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  DollarSign,
  Calendar,
  FileText,
  Users,
  Building,
  Lock,
  TrendingUp
} from 'lucide-react';

const PayoutExplanationPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Payout System Guide</h1>
        <p className="text-lg text-gray-600">
          Everything you need to know about receiving payments from Mnbarh Marketplace
        </p>
      </div>

      {/* Quick Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">1. Earn Money</h3>
              <p className="text-sm text-gray-600">
                Complete sales and earn money from your marketplace activities
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">2. Request Payout</h3>
              <p className="text-sm text-gray-600">
                Submit a payout request with your bank account details
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold">3. Review Process</h3>
              <p className="text-sm text-gray-600">
                Our team reviews and approves your request (usually within 24-48 hours)
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">4. Get Paid</h3>
              <p className="text-sm text-gray-600">
                Receive money in your bank account within 3-5 business days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Payout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Weekly Processing</h3>
            <p className="text-blue-800">
              Payouts are processed every Friday. Requests submitted by Thursday 5 PM EST 
              are included in that week's batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Processing Timeline</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Request Submitted:</strong> Immediate confirmation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Manual Review:</strong> 24-48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Approval:</strong> Usually same day as review</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Bank Transfer:</strong> 3-5 business days</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Important Dates</h4>
              <ul className="space-y-2 text-sm">
                <li><strong>Submission Deadline:</strong> Thursday 5 PM EST</li>
                <li><strong>Processing Day:</strong> Friday</li>
                <li><strong>Expected Arrival:</strong> Next Wednesday-Friday</li>
                <li><strong>Holiday Delays:</strong> May extend by 1-2 days</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees and Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fees and Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Payout Fees</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Processing Fee</span>
                  <span className="font-semibold">2.5% + $0.50</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Minimum Payout</span>
                  <span className="font-semibold">$10.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Maximum Payout</span>
                  <span className="font-semibold">$50,000.00</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Account Limits</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Daily Limit</span>
                  <span className="font-semibold">$1,000.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Weekly Limit</span>
                  <span className="font-semibold">$5,000.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Monthly Limit</span>
                  <span className="font-semibold">$20,000.00</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Limits increase automatically with account age and successful payout history.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security and Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security and Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Your security is our priority.</strong> All payouts are manually reviewed 
              to prevent fraud and ensure funds reach the correct recipient.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Verification Process</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Identity Verification:</strong> Required for amounts over $500</span>
                </li>
                <li className="flex items-start gap-2">
                  <Building className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Bank Verification:</strong> Micro-deposits for new accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Document Verification:</strong> Required for international transfers</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Risk Assessment:</strong> Automated and manual review</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Security Features</h4>
              <ul className="space-y-2 text-sm">
                <li>• Encrypted data transmission and storage</li>
                <li>• Multi-factor authentication for large amounts</li>
                <li>• Fraud detection algorithms</li>
                <li>• Manual review for high-risk transactions</li>
                <li>• Account monitoring and alerts</li>
                <li>• Secure bank partnerships</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Payout Statuses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold">Requested</span>
              </div>
              <p className="text-sm text-gray-600">
                Your payout request has been received and is waiting for review.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Under Review</span>
              </div>
              <p className="text-sm text-gray-600">
                Our team is manually reviewing your request for security and compliance.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold">Approved</span>
              </div>
              <p className="text-sm text-gray-600">
                Your request has been approved and queued for the next processing batch.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-semibold">Processing</span>
              </div>
              <p className="text-sm text-gray-600">
                Your payout is being processed and transferred to your bank account.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-semibold">Paid</span>
              </div>
              <p className="text-sm text-gray-600">
                The transfer has been completed. Allow 1-3 days for bank processing.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="font-semibold">Rejected</span>
              </div>
              <p className="text-sm text-gray-600">
                Your request was rejected. Check the reason and resubmit if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">How long does it take to receive my money?</h4>
              <p className="text-sm text-gray-600">
                After approval, payouts take 3-5 business days to appear in your bank account. 
                International transfers may take longer.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Why was my payout request rejected?</h4>
              <p className="text-sm text-gray-600">
                Common reasons include: insufficient account verification, suspicious activity, 
                incorrect bank details, or violation of marketplace policies. 
                The specific reason will be provided in the rejection notice.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Can I cancel a payout request?</h4>
              <p className="text-sm text-gray-600">
                Yes, you can cancel requests that are still "Requested" or "Under Review". 
                Once approved, cancellations are not possible.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">What if I enter wrong bank details?</h4>
              <p className="text-sm text-gray-600">
                Contact support immediately. We may be able to stop the transfer if caught early. 
                Otherwise, you'll need to work with your bank to recover the funds.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Are there any tax implications?</h4>
              <p className="text-sm text-gray-600">
                You are responsible for reporting income from marketplace activities. 
                We provide annual statements for tax purposes. Consult a tax professional for advice.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Contact Support</h4>
              <ul className="space-y-2 text-sm">
                <li><strong>Email:</strong> payouts@mnbarh.com</li>
                <li><strong>Phone:</strong> +1 (555) 123-4567</li>
                <li><strong>Hours:</strong> Monday-Friday, 9 AM - 6 PM EST</li>
                <li><strong>Response Time:</strong> Within 24 hours</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>• <a href="#" className="text-blue-600 hover:underline">Payout Policy</a></li>
                <li>• <a href="#" className="text-blue-600 hover:underline">Security Guide</a></li>
                <li>• <a href="#" className="text-blue-600 hover:underline">FAQ Center</a></li>
                <li>• <a href="#" className="text-blue-600 hover:underline">Video Tutorials</a></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutExplanationPage;
