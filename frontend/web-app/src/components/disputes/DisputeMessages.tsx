import { Dispute } from '../../services/disputeService';
import disputeService from '../../services/disputeService';

interface DisputeMessagesProps {
  dispute: Dispute;
}

export default function DisputeMessages({ dispute }: DisputeMessagesProps) {
  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'BUYER':
        return '👤';
      case 'SELLER':
        return '🏪';
      case 'ADMIN':
        return '👮';
      default:
        return '📝';
    }
  };

  const getSenderLabel = (sender: string) => {
    switch (sender) {
      case 'BUYER':
        return 'Buyer';
      case 'SELLER':
        return 'Seller';
      case 'ADMIN':
        return 'MNbarh Admin';
      default:
        return sender;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Dispute Messages</h3>
        <div className="text-sm text-gray-500">
          {dispute.messages.length} messages
        </div>
      </div>

      {/* Messages Container */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {dispute.messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Messages will appear here once the dispute process begins
            </p>
          </div>
        ) : (
          dispute.messages.map((message, index) => {
            const isBuyer = message.sender === 'BUYER';
            const isSeller = message.sender === 'SELLER';
            const isAdmin = message.sender === 'ADMIN';
            
            return (
              <div
                key={index}
                className={`flex ${isBuyer ? 'justify-start' : isSeller ? 'justify-end' : 'justify-center'}`}
              >
                <div className={`max-w-md ${isAdmin ? 'text-center' : ''}`}>
                  {/* Sender Badge */}
                  {!isAdmin && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${disputeService.getSenderBadgeColor(message.sender)}`}>
                        <span className="mr-1">{getSenderIcon(message.sender)}</span>
                        {getSenderLabel(message.sender)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {disputeService.formatDate(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Admin Message */}
                  {isAdmin && (
                    <div className="text-center mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${disputeService.getSenderBadgeColor(message.sender)}`}>
                        <span className="mr-1">{getSenderIcon(message.sender)}</span>
                        {getSenderLabel(message.sender)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {disputeService.formatDate(message.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-lg p-4 ${
                      isBuyer
                        ? 'bg-blue-50 border border-blue-200 text-blue-900'
                        : isSeller
                        ? 'bg-green-50 border border-green-200 text-green-900'
                        : 'bg-purple-50 border border-purple-200 text-purple-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>

                  {/* Message Status for Admin */}
                  {isAdmin && (
                    <div className="text-center mt-2">
                      <span className="text-xs text-purple-600 italic">
                        Official MNbarh Communication
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Communication Guidelines */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Communication Guidelines</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Be respectful and professional in all communications</li>
            <li>• Provide clear and factual information</li>
            <li>• Upload evidence when requested by admin</li>
            <li>• Admin messages are official and binding</li>
            <li>• All messages are recorded for dispute resolution</li>
          </ul>
          
          {dispute.status !== 'RESOLVED' && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a read-only view. New messages cannot be added at this time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
