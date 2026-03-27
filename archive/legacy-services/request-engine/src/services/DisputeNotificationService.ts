// ============================================
// Dispute Notification Service
// Handles email and in-app notifications for disputes
// ============================================

export interface NotificationData {
  disputeId: string;
  requestId: number;
  userId: string;
  userEmail?: string;
  userName?: string;
  reason?: string;
  description?: string;
  resolution?: string;
  resolutionPercentage?: number;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Notification templates
const TEMPLATES = {
  DISPUTE_OPENED_BUYER: 'dispute-opened-buyer',
  DISPUTE_OPENED_SELLER: 'dispute-opened-seller',
  EVIDENCE_ADDED: 'evidence-added',
  DISPUTE_UNDER_REVIEW: 'dispute-under-review',
  DISPUTE_RESOLVED: 'dispute-resolved',
  DISPUTE_CLOSED: 'dispute-closed'
};

export class DisputeNotificationService {
  private emailService: any;
  private inAppService: any;

  constructor() {
    // Initialize email service (placeholder)
    this.emailService = {
      send: async (to: string, template: string, data: any): Promise<boolean> => {
        console.log(`[Email Mock] Sending template ${template} to ${to}`);
        return true;
      }
    };

    // Initialize in-app notification service (placeholder)
    this.inAppService = {
      notify: async (userId: string, notification: any): Promise<boolean> => {
        console.log(`[InApp Mock] Notifying user ${userId}`);
        return true;
      }
    };
  }

  /**
   * Send dispute opened notification to buyer
   */
  async notifyDisputeOpenedBuyer(data: NotificationData): Promise<void> {
    console.log(`[Notification] Dispute ${data.disputeId} opened by buyer ${data.userId}`);

    // Send email notification
    if (data.userEmail) {
      await this.emailService.send(
        data.userEmail,
        TEMPLATES.DISPUTE_OPENED_BUYER,
        {
          userName: data.userName,
          disputeId: data.disputeId,
          requestId: data.requestId,
          reason: data.reason,
          description: data.description
        }
      );
    }

    // Send in-app notification
    await this.inAppService.notify(data.userId, {
      type: 'DISPUTE_OPENED',
      title: 'Dispute Opened',
      message: `Your dispute for request #${data.requestId} has been opened.`,
      data: {
        disputeId: data.disputeId,
        requestId: data.requestId
      }
    });
  }

  /**
   * Send dispute opened notification to seller
   */
  async notifyDisputeOpenedSeller(data: NotificationData): Promise<void> {
    console.log(`[Notification] Dispute ${data.disputeId} opened against seller ${data.userId}`);

    // Send email notification
    if (data.userEmail) {
      await this.emailService.send(
        data.userEmail,
        TEMPLATES.DISPUTE_OPENED_SELLER,
        {
          userName: data.userName,
          disputeId: data.disputeId,
          requestId: data.requestId,
          reason: data.reason,
          description: data.description
        }
      );
    }

    // Send in-app notification
    await this.inAppService.notify(data.userId, {
      type: 'DISPUTE_RECEIVED',
      title: 'New Dispute',
      message: `A dispute has been opened for your request #${data.requestId}.`,
      data: {
        disputeId: data.disputeId,
        requestId: data.requestId
      }
    });
  }

  /**
   * Send evidence added notification
   */
  async notifyEvidenceAdded(data: NotificationData, addedBy: string): Promise<void> {
    console.log(`[Notification] Evidence added to dispute ${data.disputeId} by ${addedBy}`);

    // Send notification to the other party
    await this.inAppService.notify(data.userId, {
      type: 'EVIDENCE_ADDED',
      title: 'New Evidence',
      message: `New evidence has been added to dispute #${data.disputeId}.`,
      data: {
        disputeId: data.disputeId,
        addedBy
      }
    });
  }

  /**
   * Send dispute under review notification
   */
  async notifyDisputeUnderReview(data: NotificationData): Promise<void> {
    console.log(`[Notification] Dispute ${data.disputeId} is now under review`);

    await this.inAppService.notify(data.userId, {
      type: 'DISPUTE_UNDER_REVIEW',
      title: 'Dispute Under Review',
      message: `Your dispute #${data.disputeId} is now being reviewed by our team.`,
      data: {
        disputeId: data.disputeId
      }
    });
  }

  /**
   * Send dispute resolved notification
   */
  async notifyDisputeResolved(data: NotificationData): Promise<void> {
    console.log(`[Notification] Dispute ${data.disputeId} resolved: ${data.resolution}`);

    const resolutionMessages: Record<string, string> = {
      REFUND_BUYER: 'A full refund has been issued to your account.',
      RELEASE_TO_SELLER: 'The funds have been released to the seller.',
      PARTIAL_REFUND: `A partial refund of ${data.resolutionPercentage}% has been issued.`
    };

    // Send email notification
    if (data.userEmail) {
      await this.emailService.send(
        data.userEmail,
        TEMPLATES.DISPUTE_RESOLVED,
        {
          userName: data.userName,
          disputeId: data.disputeId,
          resolution: data.resolution,
          message: resolutionMessages[data.resolution || ''] || ''
        }
      );
    }

    // Send in-app notification
    await this.inAppService.notify(data.userId, {
      type: 'DISPUTE_RESOLVED',
      title: 'Dispute Resolved',
      message: `Your dispute #${data.disputeId} has been resolved.`,
      data: {
        disputeId: data.disputeId,
        resolution: data.resolution
      }
    });
  }

  /**
   * Send admin notification for new dispute
   */
  async notifyAdminNewDispute(data: NotificationData): Promise<void> {
    console.log(`[Notification] Admin notified of new dispute ${data.disputeId}`);

    // This would typically send to an admin channel or webhook
    await this.inAppService.notify('admin', {
      type: 'ADMIN_NEW_DISPUTE',
      title: 'New Dispute Alert',
      message: `New dispute #${data.disputeId} requires attention.`,
      priority: 'high',
      data: {
        disputeId: data.disputeId,
        requestId: data.requestId,
        reason: data.reason
      }
    });
  }

  /**
   * Send batch notifications for dispute events
   */
  async sendBatchNotifications(
    buyerId: string,
    sellerId: string,
    type: string,
    data: NotificationData
  ): Promise<void> {
    // Notify both parties
    await Promise.all([
      this.inAppService.notify(buyerId, {
        type,
        data
      }),
      this.inAppService.notify(sellerId, {
        type,
        data
      })
    ]);
  }
}

// Export singleton instance
export const disputeNotificationService = new DisputeNotificationService();
