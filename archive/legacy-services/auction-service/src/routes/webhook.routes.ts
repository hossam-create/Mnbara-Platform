import { Router, Request, Response } from 'express';
import amqp from 'amqplib';

const router = Router();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://mnbara:mnbara_dev_password@localhost:5672';

// Connection management
let channel: amqp.Channel | null = null;

async function getChannel(): Promise<amqp.Channel> {
  if (channel) return channel;
  
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('mnbara.auctions', 'topic', { durable: true });
    await channel.assertQueue('auction-events', { durable: true });
    await channel.bindQueue('auction-events', 'mnbara.auctions', 'auction.*');
    console.log('[AuctionWebhook] RabbitMQ channel created');
    return channel;
  } catch (error) {
    console.error('[AuctionWebhook] Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

/**
 * Auction Webhook Routes
 * مسارات إشعارات المزاد
 */

/**
 * POST /api/webhooks/auctions/outbid
 * Called when a user is outbid in an auction
 */
router.post('/outbid', async (req: Request, res: Response) => {
  try {
    const { 
      auctionId, 
      outbidUserId, 
      newBidAmount, 
      previousBidAmount,
      newBidderId,
      auctionTitle,
      auctionEndsAt 
    } = req.body;

    if (!auctionId || !outbidUserId || !newBidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, outbidUserId, newBidAmount'
      });
    }

    const outbidEvent = {
      type: 'auction.outbid',
      auctionId,
      outbidUserId,
      newBidAmount,
      previousBidAmount,
      newBidderId,
      auctionTitle,
      auctionEndsAt,
      timestamp: new Date().toISOString()
    };

    // Publish to RabbitMQ
    const ch = await getChannel();
    ch.publish(
      'mnbara.auctions',
      'auction.outbid',
      Buffer.from(JSON.stringify(outbidEvent)),
      { persistent: true }
    );

    // Send notification to notifications queue
    const notification = Buffer.from(JSON.stringify({
      type: 'AUCTION_OUTBID',
      userId: outbidUserId,
      title: 'You have been outbid!',
      titleAr: 'تم تجاوز مزايدتك!',
      message: `Someone placed a higher bid of ${newBidAmount} on "${auctionTitle}".`,
      messageAr: `قام شخص ما بوضع مزايدة أعلى بقيمة ${newBidAmount} على "${auctionTitle}".`,
      priority: 'high',
      data: {
        auctionId,
        newBidAmount,
        previousBidAmount,
        auctionEndsAt
      },
      timestamp: new Date().toISOString()
    }));
    
    await ch.assertQueue('notifications', { durable: true });
    ch.sendToQueue('notifications', notification, { persistent: true });

    console.log(`[AuctionWebhook] Outbid notification sent for user ${outbidUserId} on auction ${auctionId}`);

    res.json({
      success: true,
      message: 'Outbid webhook processed',
      eventId: `outbid-${auctionId}-${Date.now()}`
    });
  } catch (error) {
    console.error('[AuctionWebhook] Outbid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process outbid webhook'
    });
  }
});

/**
 * POST /api/webhooks/auctions/ending-soon
 * Called when an auction is about to end
 */
router.post('/ending-soon', async (req: Request, res: Response) => {
  try {
    const { auctionId, auctionTitle, endsAt, currentBid, watcherIds } = req.body;

    if (!auctionId || !watcherIds || !Array.isArray(watcherIds)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, watcherIds (array)'
      });
    }

    const ch = await getChannel();

    // Notify all watchers
    for (const userId of watcherIds) {
      const notification = Buffer.from(JSON.stringify({
        type: 'AUCTION_ENDING_SOON',
        userId,
        title: 'Auction ending soon!',
        titleAr: 'المزاد ينتهي قريباً!',
        message: `"${auctionTitle}" is ending in 5 minutes. Current bid: ${currentBid}`,
        messageAr: `"${auctionTitle}" ينتهي خلال 5 دقائق. المزايدة الحالية: ${currentBid}`,
        priority: 'high',
        data: { auctionId, endsAt, currentBid },
        timestamp: new Date().toISOString()
      }));

      ch.sendToQueue('notifications', notification, { persistent: true });
    }

    console.log(`[AuctionWebhook] Ending soon notifications sent to ${watcherIds.length} users for auction ${auctionId}`);

    res.json({
      success: true,
      message: 'Ending soon notifications sent',
      notifiedCount: watcherIds.length
    });
  } catch (error) {
    console.error('[AuctionWebhook] Ending soon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process ending-soon webhook'
    });
  }
});

/**
 * POST /api/webhooks/auctions/ended
 * Called when an auction ends
 */
router.post('/ended', async (req: Request, res: Response) => {
  try {
    const { 
      auctionId, 
      auctionTitle,
      winnerId, 
      winningBid,
      sellerId,
      reserveMet,
      totalBids 
    } = req.body;

    if (!auctionId || !sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, sellerId'
      });
    }

    const ch = await getChannel();

    // Publish auction ended event
    const endedEvent = {
      type: 'auction.ended',
      auctionId,
      auctionTitle,
      winnerId,
      winningBid,
      sellerId,
      reserveMet,
      totalBids,
      timestamp: new Date().toISOString()
    };

    ch.publish(
      'mnbara.auctions',
      'auction.ended',
      Buffer.from(JSON.stringify(endedEvent)),
      { persistent: true }
    );

    // Notify seller
    const sellerNotification = Buffer.from(JSON.stringify({
      type: 'AUCTION_ENDED',
      userId: sellerId,
      title: winnerId ? 'Your auction sold!' : 'Your auction has ended',
      titleAr: winnerId ? 'تم بيع مزادك!' : 'انتهى مزادك',
      message: winnerId 
        ? `"${auctionTitle}" sold for ${winningBid}!`
        : `"${auctionTitle}" ended without a winner.`,
      messageAr: winnerId 
        ? `تم بيع "${auctionTitle}" بمبلغ ${winningBid}!`
        : `انتهى "${auctionTitle}" بدون فائز.`,
      priority: 'high',
      data: { auctionId, winnerId, winningBid, reserveMet },
      timestamp: new Date().toISOString()
    }));
    ch.sendToQueue('notifications', sellerNotification, { persistent: true });

    // Notify winner if exists
    if (winnerId) {
      const winnerNotification = Buffer.from(JSON.stringify({
        type: 'AUCTION_WON',
        userId: winnerId,
        title: 'Congratulations! You won the auction!',
        titleAr: 'تهانينا! لقد فزت بالمزاد!',
        message: `You won "${auctionTitle}" for ${winningBid}. Complete payment to finalize.`,
        messageAr: `فزت بـ "${auctionTitle}" بمبلغ ${winningBid}. أكمل الدفع لإتمام العملية.`,
        priority: 'high',
        data: { auctionId, winningBid },
        timestamp: new Date().toISOString()
      }));
      ch.sendToQueue('notifications', winnerNotification, { persistent: true });
    }

    console.log(`[AuctionWebhook] Auction ${auctionId} ended. Winner: ${winnerId || 'none'}`);

    res.json({
      success: true,
      message: 'Auction ended webhook processed',
      auctionId,
      winnerId,
      reserveMet
    });
  } catch (error) {
    console.error('[AuctionWebhook] Ended error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process ended webhook'
    });
  }
});

/**
 * POST /api/webhooks/auctions/extended
 * Called when an auction is auto-extended
 */
router.post('/extended', async (req: Request, res: Response) => {
  try {
    const { 
      auctionId, 
      auctionTitle,
      previousEndTime,
      newEndTime,
      extensionNumber,
      bidderId 
    } = req.body;

    if (!auctionId || !newEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: auctionId, newEndTime'
      });
    }

    const ch = await getChannel();

    // Publish extension event
    const extensionEvent = {
      type: 'auction.extended',
      auctionId,
      auctionTitle,
      previousEndTime,
      newEndTime,
      extensionNumber,
      triggeredBy: bidderId,
      timestamp: new Date().toISOString()
    };

    ch.publish(
      'mnbara.auctions',
      'auction.extended',
      Buffer.from(JSON.stringify(extensionEvent)),
      { persistent: true }
    );

    console.log(`[AuctionWebhook] Auction ${auctionId} extended to ${newEndTime}`);

    res.json({
      success: true,
      message: 'Extension webhook processed',
      auctionId,
      newEndTime
    });
  } catch (error) {
    console.error('[AuctionWebhook] Extended error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process extended webhook'
    });
  }
});

export default router;
