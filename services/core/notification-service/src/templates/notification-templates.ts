/**
 * Notification Templates
 * All templates for different notification types
 */

export const NOTIFICATION_TEMPLATES = [
  // ============ AUCTION TEMPLATES ============
  {
    name: 'auction-ending-soon',
    type: 'AUCTION_ENDING_SOON',
    channel: 'PUSH',
    title: '⏰ Auction Ending Soon!',
    subject: 'Auction "{{auctionTitle}}" is ending soon!',
    template: 'Your auction "{{auctionTitle}}" is ending in {{minutesRemaining}} minutes! Current bid: {{currentBid}} {{currency}}. Place your bid now!',
    variables: ['auctionTitle', 'minutesRemaining', 'currentBid', 'currency', 'auctionId'],
  },
  {
    name: 'new-bid-received',
    type: 'NEW_BID_RECEIVED',
    channel: 'PUSH',
    title: '💰 New Bid on Your Auction!',
    subject: 'New bid on "{{auctionTitle}}"',
    template: 'You received a new bid of {{bidAmount}} {{currency}} on your auction "{{auctionTitle}}" from {{bidderName}}!',
    variables: ['auctionTitle', 'bidAmount', 'currency', 'bidderName', 'auctionId'],
  },
  {
    name: 'outbid',
    type: 'OUTBID',
    channel: 'PUSH',
    title: '😮 You Have Been Outbid!',
    subject: 'Outbid on "{{auctionTitle}}"',
    template: 'Your bid on "{{auctionTitle}}" has been outbid! The current high bid is {{currentBid}} {{currency}}. Bid again to stay in the running!',
    variables: ['auctionTitle', 'currentBid', 'currency', 'auctionId'],
  },
  {
    name: 'auction-won',
    type: 'AUCTION_WON',
    channel: 'PUSH',
    title: '🎉 Congratulations! You Won!',
    subject: 'Congratulations! You won "{{auctionTitle}}"',
    template: 'Congratulations! You won the auction "{{auctionTitle}}" with a bid of {{winningBid}} {{currency}}! Complete your payment to finalize the purchase.',
    variables: ['auctionTitle', 'winningBid', 'currency', 'orderId', 'paymentDeadline'],
  },
  {
    name: 'auction-lost',
    type: 'AUCTION_LOST',
    channel: 'PUSH',
    title: 'Auction Ended',
    subject: 'Auction "{{auctionTitle}}" has ended',
    template: 'The auction "{{auctionTitle}}" has ended. The winning bid was {{winningBid}} {{currency}}. Better luck next time!',
    variables: ['auctionTitle', 'winningBid', 'currency'],
  },
  {
    name: 'auction-cancelled',
    type: 'AUCTION_CANCELLED',
    channel: 'PUSH',
    title: 'Auction Cancelled',
    subject: 'Auction "{{auctionTitle}}" has been cancelled',
    template: 'The auction "{{auctionTitle}}" has been cancelled by the seller. Any bids have been refunded.',
    variables: ['auctionTitle', 'reason'],
  },

  // ============ ORDER TEMPLATES ============
  {
    name: 'order-confirmed',
    type: 'ORDER_CONFIRMED',
    channel: 'PUSH',
    title: '✅ Order Confirmed!',
    subject: 'Order #{{orderId}} confirmed',
    template: 'Your order #{{orderId}} has been confirmed! Total: {{total}} {{currency}}. We\'ll notify you when it ships.',
    variables: ['orderId', 'total', 'currency', 'itemCount'],
  },
  {
    name: 'order-shipped',
    type: 'ORDER_SHIPPED',
    channel: 'PUSH',
    title: '📦 Your Order is on the Way!',
    subject: 'Order #{{orderId}} has been shipped',
    template: 'Great news! Your order #{{orderId}} has been shipped via {{shippingMethod}}. Track number: {{trackingNumber}}',
    variables: ['orderId', 'shippingMethod', 'trackingNumber', 'carrier'],
  },
  {
    name: 'order-delivered',
    type: 'ORDER_DELIVERED',
    channel: 'PUSH',
    title: '📬 Your Order Has Arrived!',
    subject: 'Order #{{orderId}} delivered',
    template: 'Your order #{{orderId}} has been delivered! Enjoy your purchase. Please leave a review if you\'re satisfied.',
    variables: ['orderId'],
  },
  {
    name: 'order-cancelled',
    type: 'ORDER_CANCELLED',
    channel: 'PUSH',
    title: '❌ Order Cancelled',
    subject: 'Order #{{orderId}} cancelled',
    template: 'Your order #{{orderId}} has been cancelled. {{refundInfo}}',
    variables: ['orderId', 'refundInfo', 'refundAmount'],
  },
  {
    name: 'order-dispute',
    type: 'ORDER_DISPUTE',
    channel: 'PUSH',
    title: '⚠️ Order Dispute Update',
    subject: 'Dispute update for order #{{orderId}}',
    template: 'There\'s an update on your dispute for order #{{orderId}}: {{disputeUpdate}}',
    variables: ['orderId', 'disputeUpdate', 'disputeStatus'],
  },

  // ============ PAYMENT TEMPLATES ============
  {
    name: 'payment-received',
    type: 'PAYMENT_RECEIVED',
    channel: 'PUSH',
    title: '💳 Payment Received!',
    subject: 'Payment of {{amount}} {{currency}} received',
    template: 'We received your payment of {{amount}} {{currency}} for {{description}}. Transaction ID: {{transactionId}}',
    variables: ['amount', 'currency', 'description', 'transactionId'],
  },
  {
    name: 'payment-failed',
    type: 'PAYMENT_FAILED',
    channel: 'PUSH',
    title: '⚠️ Payment Failed',
    subject: 'Payment of {{amount}} {{currency}} failed',
    template: 'Your payment of {{amount}} {{currency}} for {{description}} failed. Please try again or use a different payment method.',
    variables: ['amount', 'currency', 'description', 'orderId'],
  },
  {
    name: 'refund-issued',
    type: 'REFUND_ISSUED',
    channel: 'PUSH',
    title: '💰 Refund Issued',
    subject: 'Refund of {{amount}} {{currency}} issued',
    template: 'A refund of {{amount}} {{currency}} has been issued to your original payment method for {{description}}. Allow 5-7 business days.',
    variables: ['amount', 'currency', 'description', 'refundId'],
  },

  // ============ CHAT TEMPLATES ============
  {
    name: 'new-message',
    type: 'NEW_MESSAGE',
    channel: 'PUSH',
    title: '💬 New Message from {{senderName}}',
    subject: 'New message from {{senderName}}',
    template: '{{senderName}}: {{messagePreview}}',
    variables: ['senderName', 'messagePreview', 'conversationId', 'messageId'],
  },

  // ============ SYSTEM TEMPLATES ============
  {
    name: 'account-verified',
    type: 'ACCOUNT_VERIFIED',
    channel: 'PUSH',
    title: '✅ Account Verified',
    subject: 'Your account has been verified',
    template: 'Congratulations! Your account has been successfully verified. You now have full access to all Mnbara features.',
    variables: [],
  },
  {
    name: 'password-changed',
    type: 'PASSWORD_CHANGED',
    channel: 'PUSH',
    title: '🔐 Password Changed',
    subject: 'Your password was changed',
    template: 'Your password was successfully changed. If you didn\'t make this change, please contact support immediately.',
    variables: ['changedAt'],
  },
  {
    name: 'new-review',
    type: 'NEW_REVIEW',
    channel: 'PUSH',
    title: '⭐ New Review Received',
    subject: 'New review on "{{itemName}}"',
    template: 'You received a new {{rating}}-star review: "{{reviewText}}"',
    variables: ['itemName', 'rating', 'reviewText', 'reviewerName'],
  },
  {
    name: 'system-alert',
    type: 'SYSTEM_ALERT',
    channel: 'PUSH',
    title: '⚠️ {{alertTitle}}',
    subject: '{{alertTitle}}',
    template: '{{alertMessage}}',
    variables: ['alertTitle', 'alertMessage', 'alertType'],
  },
];

// Email-specific templates (HTML)
export const EMAIL_TEMPLATES = {
  orderConfirmation: {
    subject: 'Order Confirmed - #{{orderId}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .order-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi {{customerName}},</p>
            <p>Thank you for your order! We've confirmed your purchase.</p>
            <div class="order-details">
              <h3>Order #{{orderId}}</h3>
              <p><strong>Total:</strong> {{total}} {{currency}}</p>
              <p><strong>Items:</strong> {{itemCount}}</p>
              <p><strong>Shipping to:</strong> {{shippingAddress}}</p>
            </div>
            <p>We'll notify you when your order ships.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mnbara. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  auctionWon: {
    subject: '🎉 Congratulations! You Won - {{auctionTitle}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .auction-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>You won the auction!</p>
          </div>
          <div class="content">
            <p>Hi {{winnerName}},</p>
            <p>Congratulations! You are the winning bidder for:</p>
            <div class="auction-info">
              <h3>{{auctionTitle}}</h3>
              <p><strong>Winning Bid:</strong> {{winningBid}} {{currency}}</p>
              <p><strong>Payment Deadline:</strong> {{paymentDeadline}}</p>
            </div>
            <a href="{{paymentUrl}}" class="button">Complete Payment</a>
            <p>Please complete your payment within {{paymentDeadline}} to finalize your purchase.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mnbara. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  outbid: {
    subject: '😮 You\'ve Been Outbid! - {{auctionTitle}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .auction-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>😮 You\'ve Been Outbid!</h1>
          </div>
          <div class="content">
            <p>Hi {{userName}},</p>
            <p>Someone has outbid you on:</p>
            <div class="auction-info">
              <h3>{{auctionTitle}}</h3>
              <p><strong>Current Bid:</strong> {{currentBid}} {{currency}}</p>
              <p><strong>Your Bid:</strong> {{yourBid}} {{currency}}</p>
              <p><strong>Time Left:</strong> {{timeRemaining}}</p>
            </div>
            <a href="{{bidUrl}}" class="button">Place Higher Bid</a>
            <p>Don't lose out on this item!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mnbara. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },

  paymentReceived: {
    subject: '💳 Payment Received - {{amount}} {{currency}}',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .payment-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Received</h1>
          </div>
          <div class="content">
            <p>Hi {{recipientName}},</p>
            <p>We received your payment successfully.</p>
            <div class="payment-info">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
              <p><strong>Transaction ID:</strong> {{transactionId}}</p>
              <p><strong>Description:</strong> {{description}}</p>
              <p><strong>Date:</strong> {{date}}</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 Mnbara. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
};

// Export templates for seeding
export function getTemplateByName(name: string) {
  return NOTIFICATION_TEMPLATES.find(t => t.name === name);
}

export function getTemplatesByType(type: string) {
  return NOTIFICATION_TEMPLATES.filter(t => t.type === type);
}

export function getTemplatesByChannel(channel: string) {
  return NOTIFICATION_TEMPLATES.filter(t => t.channel === channel);
}
