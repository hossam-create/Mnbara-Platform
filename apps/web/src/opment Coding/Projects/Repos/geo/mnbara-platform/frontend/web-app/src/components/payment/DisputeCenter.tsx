import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  MessageSquare, 
  Upload, 
  CheckCircle, 
  Clock, 
  Scale,
  FileText,
  Send,
  Plus
} from 'lucide-react';

interface Dispute {
  id: string;
  orderId: string;
  listingTitle: string;
  disputeType: string;
  description: string;
  status: 'open' | 'escalated' | 'resolved' | 'dismissed';
  amount: number;
  requestedResolution: string;
  createdAt: string;
  role: 'initiator' | 'respondent';
  winner?: 'buyer' | 'seller' | 'split';
  refundAmount?: number;
}

interface DisputeMessage {
  id: string;
  senderName: string;
  message: string;
  attachments: string[];
  isPrivate: boolean;
  createdAt: string;
  isOwn: boolean;
}

interface DisputeEvidence {
  id: string;
  type: 'photo' | 'video' | 'document' | 'message' | 'tracking_info';
  url: string;
  description: string;
  uploadedBy: 'buyer' | 'seller';
  uploadedAt: string;
}

const DisputeCenter: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewDispute, setShowNewDispute] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/disputes/my-disputes');
      const data = await response.json();
      setDisputes(data);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeDetails = async (disputeId: string) => {
    try {
      const [detailsRes, messagesRes, evidenceRes] = await Promise.all([
        fetch(`/api/disputes/${disputeId}`),
        fetch(`/api/disputes/${disputeId}/messages`),
        fetch(`/api/disputes/${disputeId}/evidence`)
      ]);

      const details = await detailsRes.json();
      const messagesData = await messagesRes.json();
      const evidenceData = await evidenceRes.json();

      setSelectedDispute(details);
      setMessages(messagesData);
      setEvidence(evidenceData);
    } catch (error) {
      console.error('Failed to fetch dispute details:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;

    try {
      const response = await fetch(`/api/disputes/${selectedDispute.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          isPrivate: false
        })
      });

      if (response.ok) {
        const messageData = await response.json();
        setMessages([...messages, { ...messageData, isOwn: true }]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const uploadEvidence = async (file: File, description: string) => {
    if (!selectedDispute) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);

      const response = await fetch(`/api/disputes/${selectedDispute.id}/evidence`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const evidenceData = await response.json();
        setEvidence([...evidence, evidenceData]);
      }
    } catch (error) {
      console.error('Failed to upload evidence:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'dismissed':
        return <Scale className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-orange-100 text-orange-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getResolutionColor = (winner?: string) => {
    if (!winner) return '';
    switch (winner) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800';
      case 'seller':
        return 'bg-green-100 text-green-800';
      case 'split':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispute Center</h1>
          <p className="text-gray-600 mt-1">Manage order disputes and resolutions</p>
        </div>
        <Button onClick={() => setShowNewDispute(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Dispute
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disputes List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                My Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <div className="text-center py-8">
                  <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No disputes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDispute?.id === dispute.id ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => fetchDisputeDetails(dispute.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{dispute.listingTitle}</p>
                          <p className="text-xs text-gray-500">Order #{dispute.orderId}</p>
                        </div>
                        {getStatusIcon(dispute.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(dispute.status)}>
                          {dispute.status}
                        </Badge>
                        {dispute.winner && (
                          <Badge className={getResolutionColor(dispute.winner)}>
                            {dispute.winner} won
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {dispute.role === 'initiator' ? 'You initiated' : 'You are responding'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dispute Details */}
        <div className="lg:col-span-2">
          {selectedDispute ? (
            <div className="space-y-6">
              {/* Dispute Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedDispute.listingTitle}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedDispute.status)}>
                        {selectedDispute.status}
                      </Badge>
                      {selectedDispute.winner && (
                        <Badge className={getResolutionColor(selectedDispute.winner)}>
                          {selectedDispute.winner} won
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Dispute Type</p>
                      <p className="font-medium">{selectedDispute.disputeType.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p>{selectedDispute.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Requested Resolution</p>
                      <p className="font-medium">{selectedDispute.requestedResolution.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="font-medium">${(selectedDispute.amount / 100).toFixed(2)}</p>
                    </div>
                    {selectedDispute.refundAmount && (
                      <div>
                        <p className="text-sm text-gray-600">Refund Amount</p>
                        <p className="font-medium text-green-600">
                          ${(selectedDispute.refundAmount / 100).toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p>{new Date(selectedDispute.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evidence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Evidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evidence.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          {item.type === 'photo' && '📷'}
                          {item.type === 'video' && '🎥'}
                          {item.type === 'document' && '📄'}
                          {item.type === 'message' && '💬'}
                          {item.type === 'tracking_info' && '📦'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {item.uploadedBy} • {new Date(item.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                    {evidence.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No evidence submitted yet</p>
                    )}
                  </div>
                  <div className="mt-4">
                    <input
                      type="file"
                      id="evidence-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const description = prompt('Describe this evidence:');
                          if (description) {
                            uploadEvidence(file, description);
                          }
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="evidence-upload" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Evidence
                      </label>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            message.isOwn
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="font-medium text-sm">{message.senderName}</p>
                          <p>{message.message}</p>
                          {message.attachments.length > 0 && (
                            <div className="mt-2">
                              {message.attachments.map((attachment, index) => (
                                <a
                                  key={index}
                                  href={attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline block"
                                >
                                  Attachment {index + 1}
                                </a>
                              ))}
                            </div>
                          )}
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedDispute.status === 'open' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border rounded-lg"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a dispute to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeCenter;
