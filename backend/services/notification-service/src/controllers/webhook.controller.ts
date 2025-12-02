import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface WebhookEvent {
    event_type: string;
    data: any;
    triggered_at: Date;
}

export class WebhookController {
    
    /**
     * Auction outbid webhook
     * POST /api/webhooks/auctions/outbid
     */
    async handleAuctionOutbid(req: Request, res: Response) {
        try {
            const { auction_id, previous_bid_id, new_highest_bid_id, outbid_at } = req.body;

            if (!auction_id || !new_highest_bid_id) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Get bid details
            const newBid = await prisma.bid.findUnique({
                where: { id: new_highest_bid_id },
                include: {
                    bidder: {
                        select: { id: true, firstName: true, email: true }
                    }
                }
            });

            const previousBid = previous_bid_id ? await prisma.bid.findUnique({
                where: { id: previous_bid_id },
                include: {
                    bidder: {
                        select: { id: true, firstName: true, email: true }
                    }
                }
            }) : null;

            // Publish notification events
            if (previousBid) {
                await this.publishNotificationEvent({
                    user_id: previousBid.bidderId,
                    type: 'AUCTION_OUTBID',
                    title: 'You\'ve been outbid!',
                    message: `Your bid of $${previousBid.amount} has been outbid. New highest bid: $${newBid?.amount}`,
                    data: {
                        auction_id,
                        your_bid: previousBid.amount,
                        new_bid: newBid?.amount
                    }
                });
            }

            return res.json({
                success: true,
                message: 'Webhook processed',
                notifications_sent: previousBid ? 1 : 0
            });

        } catch (error: any) {
            console.error('Auction outbid webhook error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Auction ended webhook
     * POST /api/webhooks/auctions/ended
     */
    async handleAuctionEnded(req: Request, res: Response) {
        try {
            const { auction_id, winner_id, winning_bid } = req.body;

            // Notify winner
            if (winner_id) {
                await this.publishNotificationEvent({
                    user_id: winner_id,
                    type: 'AUCTION_WON',
                    title: 'Congratulations! You won the auction!',
                    message: `Your winning bid: $${winning_bid}. Please proceed to payment.`,
                    data: { auction_id, winning_bid }
                });

                // Trigger escrow hold
                await this.publishEscrowEvent({
                    event: 'HOLD_FUNDS',
                    auction_id,
                    buyer_id: winner_id,
                    amount: winning_bid
                });
            }

            return res.json({ success: true });

        } catch (error: any) {
            console.error('Auction ended webhook error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Order status changed webhook
     * POST /api/webhooks/orders/status-changed
     */
    async handleOrderStatusChanged(req: Request, res: Response) {
        try {
            const { order_id, old_status, new_status, changed_at } = req.body;

            const order = await prisma.order.findUnique({
                where: { id: order_id },
                include: {
                    buyer: { select: { id: true } },
                    traveler: { select: { id: true } }
                }
            });

            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Send notifications based on status
            const notifications = [];

            if (new_status === 'DELIVERED') {
                // Notify buyer
                notifications.push({
                    user_id: order.buyerId,
                    type: 'ORDER_DELIVERED',
                    title: 'Order delivered!',
                    message: 'Please confirm receipt to release payment.',
                    data: { order_id }
                });
            }

            if (new_status === 'COMPLETED') {
                // Release escrow
                await this.publishEscrowEvent({
                    event: 'RELEASE_FUNDS',
                    order_id,
                    seller_id: order.travelerId
                });

                // Award rewards
                await this.publishRewardsEvent({
                    user_id: order.travelerId,
                    action: 'DELIVERY_COMPLETED',
                    order_id
                });
            }

            // Send all notifications
            for (const notif of notifications) {
                await this.publishNotificationEvent(notif);
            }

            return res.json({ success: true, notifications_sent: notifications.length });

        } catch (error: any) {
            console.error('Order status webhook error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Publish notification event to RabbitMQ
     */
    private async publishNotificationEvent(notification: any) {
        // TODO: Implement RabbitMQ publish to 'notifications' queue
        console.log('[RabbitMQ] Publishing notification:', notification);
    }

    /**
     * Publish escrow event to RabbitMQ
     */
    private async publishEscrowEvent(escrowEvent: any) {
        // TODO: Implement RabbitMQ publish to 'escrow' queue
        console.log('[RabbitMQ] Publishing escrow event:', escrowEvent);
    }

    /**
     * Publish rewards event to RabbitMQ
     */
    private async publishRewardsEvent(rewardEvent: any) {
        // TODO: Implement RabbitMQ publish to 'rewards' queue
        console.log('[RabbitMQ] Publishing reward event:', rewardEvent);
    }
}
