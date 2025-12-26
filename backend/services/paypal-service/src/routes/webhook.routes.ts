import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// PayPal Webhook Handler
router.post('/paypal', async (req, res) => {
  try {
    const webhookEvent = req.body;
    
    // Log webhook
    console.log('PayPal Webhook received:', webhookEvent.event_type);

    // Save webhook
    const webhook = await prisma.payPalWebhook.create({
      data: {
        webhookId: webhookEvent.id,
        eventType: webhookEvent.event_type,
        resourceType: webhookEvent.resource_type,
        payload: webhookEvent
      }
    });

    // Process based on event type
    switch (webhookEvent.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleCaptureCompleted(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handleRefundCompleted(webhookEvent);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
        await handleCaptureDenied(webhookEvent);
        break;
      
      default:
        console.log('Unhandled webhook event:', webhookEvent.event_type);
    }

    // Mark as processed
    await prisma.payPalWebhook.update({
      where: { id: webhook.id },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle order approved
async function handleOrderApproved(event: any) {
  const paypalOrderId = event.resource.id;
  
  await prisma.payPalTransaction.updateMany({
    where: { paypalOrderId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date()
    }
  });
}

// Handle capture completed
async function handleCaptureCompleted(event: any) {
  const captureId = event.resource.id;
  
  await prisma.payPalTransaction.updateMany({
    where: { captureId },
    data: {
      status: 'COMPLETED'
    }
  });
}

// Handle refund completed
async function handleRefundCompleted(event: any) {
  const refundId = event.resource.id;
  
  await prisma.payPalRefund.updateMany({
    where: { paypalRefundId: refundId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });
}

// Handle capture denied
async function handleCaptureDenied(event: any) {
  const captureId = event.resource.id;
  
  await prisma.payPalTransaction.updateMany({
    where: { captureId },
    data: {
      status: 'FAILED'
    }
  });
}

export default router;
