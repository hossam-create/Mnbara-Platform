import { Dispute } from '../../services/disputeService';
import type { DisputeTimeline } from '../../services/disputeService';
import disputeService from '../../services/disputeService';

interface DisputeTimelineProps {
  dispute: Dispute;
}

export default function DisputeTimeline({ dispute }: DisputeTimelineProps) {
  const getStepStatus = (step: DisputeTimeline) => {
    const currentStepIndex = dispute.timeline.findIndex(t => t.step === step.step);
    const disputeOpenedIndex = dispute.timeline.findIndex(t => t.step === 'DISPUTE_OPENED');
    
    // If step is before dispute opened, it's completed
    if (currentStepIndex < disputeOpenedIndex) {
      return 'completed';
    }
    
    // If dispute is resolved and this step is resolved, it's completed
    if (dispute.status === 'RESOLVED' && step.step === 'RESOLVED') {
      return 'completed';
    }
    
    // If this is the current dispute status step, it's active
    if (dispute.status === 'OPEN' && step.step === 'DISPUTE_OPENED') {
      return 'active';
    }
    if (dispute.status === 'UNDER_REVIEW' && step.step === 'UNDER_REVIEW') {
      return 'active';
    }
    if (dispute.status === 'RESOLVED' && step.step === 'RESOLVED') {
      return 'completed';
    }
    
    // Otherwise, it's pending
    return 'pending';
  };

  const getStepColor = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'active':
        return 'bg-blue-500 border-blue-500';
      case 'pending':
        return 'bg-gray-300 border-gray-300';
      default:
        return 'bg-gray-300 border-gray-300';
    }
  };

  const getStepTextColor = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'active':
        return 'text-blue-700';
      case 'pending':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Dispute Timeline</h3>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-300"></div>
        
        {/* Timeline items */}
        <div className="space-y-6">
          {dispute.timeline.map((step) => {
            const stepStatus = getStepStatus(step);
            const stepColor = getStepColor(stepStatus);
            const stepTextColor = getStepTextColor(stepStatus);
            
            return (
              <div key={step.step} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 w-12 h-12 rounded-full border-4 ${stepColor} bg-white flex items-center justify-center`}>
                  <span className="text-lg">{disputeService.getTimelineStepIcon(step.step)}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${stepTextColor}`}>
                      {disputeService.getTimelineStepLabel(step.step)}
                    </h4>
                    {stepStatus === 'active' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm ${stepTextColor} mb-1`}>
                    {disputeService.formatDate(step.date)}
                  </p>
                  
                  {/* Additional context for key steps */}
                  {step.step === 'DISPUTE_OPENED' && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Dispute Reason:</strong> {dispute.reason}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Opened by: {dispute.openedBy}
                      </p>
                    </div>
                  )}
                  
                  {step.step === 'UNDER_REVIEW' && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Your dispute is currently under review by our admin team.
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        We'll examine all evidence and make a fair decision.
                      </p>
                    </div>
                  )}
                  
                  {step.step === 'RESOLVED' && dispute.resolution && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Resolution:</strong> {disputeService.getResolutionOutcomeLabel(dispute.resolution.outcome)}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {dispute.resolution.note}
                      </p>
                      {dispute.resolution.decidedAt && (
                        <p className="text-sm text-green-600 mt-1">
                          Decided: {disputeService.formatDate(dispute.resolution.decidedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Current Status: <span className="font-medium text-gray-900">{disputeService.getStatusLabel(dispute.status)}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Duration: <span className="font-medium text-gray-900">{disputeService.getDisputeDuration(dispute)} days</span>
            </p>
          </div>
          
          {dispute.status === 'RESOLVED' && (
            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${disputeService.getResolutionOutcomeColor(dispute.resolution!.outcome)}`}>
              {disputeService.getResolutionOutcomeLabel(dispute.resolution!.outcome)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
