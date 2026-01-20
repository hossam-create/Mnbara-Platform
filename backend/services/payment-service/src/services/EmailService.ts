import nodemailer from 'nodemailer';

export interface ReceiptEmailData {
  buyerEmail: string;
  orderId: string;
  amount: number;
  listingTitle: string;
  sellerName?: string;
  purchaseDate?: Date;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceipt(data: ReceiptEmailData) {
    try {
      const htmlContent = this.generateReceiptHTML(data);
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@mnbarh.com',
        to: data.buyerEmail,
        subject: `Payment Receipt - Order #${data.orderId}`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Receipt email sent to ${data.buyerEmail}:`, result.messageId);
      
      return result;
      
    } catch (error) {
      console.error('Failed to send receipt email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML receipt template
   */
  private generateReceiptHTML(data: ReceiptEmailData): string {
    const purchaseDate = data.purchaseDate || new Date();
    const formattedDate = purchaseDate.toLocaleDateString();
    const formattedTime = purchaseDate.toLocaleTimeString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - Mnbarh</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background: linear-gradient(135deg, #EFB612 0%, #F4C430 100%);
            color: #000;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .receipt-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #EFB612;
          }
          .receipt-info h3 {
            margin: 0 0 10px 0;
            color: #000;
          }
          .receipt-info p {
            margin: 5px 0;
            color: #666;
          }
          .order-details {
            margin: 30px 0;
          }
          .order-details h3 {
            color: #000;
            border-bottom: 2px solid #EFB612;
            padding-bottom: 10px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
          }
          .item-row:last-child {
            border-bottom: none;
          }
          .item-name {
            font-weight: 600;
            color: #333;
          }
          .item-price {
            color: #666;
          }
          .total-row {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .total-row .item-row {
            font-weight: bold;
          }
          .total-amount {
            color: #EFB612;
            font-size: 24px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #666;
            font-size: 14px;
          }
          .footer a {
            color: #EFB612;
            text-decoration: none;
          }
          .thank-you {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          }
          .thank-you h2 {
            margin: 0 0 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🛍️ Mnbarh</h1>
          <p>Payment Receipt</p>
        </div>

        <div class="content">
          <div class="thank-you">
            <h2>Thank You for Your Purchase!</h2>
            <p>Your payment has been successfully processed</p>
          </div>

          <div class="receipt-info">
            <h3>Receipt Information</h3>
            <p><strong>Order ID:</strong> #${data.orderId}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Email:</strong> ${data.buyerEmail}</p>
            ${data.sellerName ? `<p><strong>Seller:</strong> ${data.sellerName}</p>` : ''}
          </div>

          <div class="order-details">
            <h3>Order Details</h3>
            
            <div class="item-row">
              <span class="item-name">${data.listingTitle}</span>
              <span class="item-price">$${data.amount.toFixed(2)}</span>
            </div>

            <div class="item-row">
              <span>Marketplace Fee (5%)</span>
              <span>$${(data.amount * 0.05).toFixed(2)}</span>
            </div>
          </div>

          <div class="total-row">
            <div class="item-row">
              <span class="item-name">Total Amount</span>
              <span class="total-amount">$${(data.amount * 1.05).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated receipt from Mnbarh Marketplace.</p>
            <p>Questions? Contact us at <a href="mailto:support@mnbarh.com">support@mnbarh.com</a></p>
            <p>Visit your <a href="https://mnbarh.com/account/orders">account</a> to track your order.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotification(buyerEmail: string, orderId: string, errorMessage: string) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed - Mnbarh</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .header {
              background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .error-info {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              color: #721c24;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .retry-button {
              display: inline-block;
              background: #EFB612;
              color: #000;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>❌ Payment Failed</h1>
            <p>We couldn't process your payment</p>
          </div>

          <div class="content">
            <h2>Order #${orderId}</h2>
            
            <div class="error-info">
              <strong>Error:</strong> ${errorMessage}
            </div>

            <p>We're sorry, but we couldn't process your payment for the above order. This could be due to:</p>
            <ul>
              <li>Insufficient funds</li>
              <li>Incorrect card details</li>
              <li>Bank security measures</li>
              <li>Temporary payment processor issues</li>
            </ul>

            <p>You can try again with a different payment method or contact your bank if the issue persists.</p>

            <a href="https://mnbarh.com/orders/${orderId}" class="retry-button">
              Try Again
            </a>

            <p>If you continue to experience issues, please contact our support team.</p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@mnbarh.com',
        to: buyerEmail,
        subject: `Payment Failed - Order #${orderId}`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Payment failure email sent to ${buyerEmail}:`, result.messageId);
      
      return result;
      
    } catch (error) {
      console.error('Failed to send payment failure email:', error);
      throw error;
    }
  }

  /**
   * Send seller notification
   */
  async sendSellerNotification(sellerEmail: string, orderId: string, buyerName: string, listingTitle: string) {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order - Mnbarh</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .header {
              background: linear-gradient(135deg, #EFB612 0%, #F4C430 100%);
              color: #000;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .order-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #EFB612;
            }
            .action-button {
              display: inline-block;
              background: #EFB612;
              color: #000;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 New Order!</h1>
            <p>You have a new sale</p>
          </div>

          <div class="content">
            <h2>Order #${orderId}</h2>
            
            <div class="order-info">
              <h3>Order Details</h3>
              <p><strong>Buyer:</strong> ${buyerName}</p>
              <p><strong>Item:</strong> ${listingTitle}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>Congratulations! You have a new order. Please prepare the item for shipping and update the tracking information once shipped.</p>

            <a href="https://mnbarh.com/seller/orders/${orderId}" class="action-button">
              View Order Details
            </a>

            <p>Remember to ship the item promptly and provide tracking information to ensure a smooth transaction.</p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@mnbarh.com',
        to: sellerEmail,
        subject: `New Order - #${orderId}`,
        html: htmlContent,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Seller notification sent to ${sellerEmail}:`, result.messageId);
      
      return result;
      
    } catch (error) {
      console.error('Failed to send seller notification:', error);
      throw error;
    }
  }
}
