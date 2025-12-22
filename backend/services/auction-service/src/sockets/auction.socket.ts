import { Server, Socket } from 'socket.io';
import { AuctionService } from '../services/auction.service';

const auctionService = new AuctionService();

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join auction room for real-time updates
    socket.on('auction:subscribe', async (data: { auctionId: string | number }) => {
      const auctionId = String(data.auctionId);
      socket.join(`auction:${auctionId}`);
      console.log(`User ${socket.id} subscribed to auction ${auctionId}`);

      // Send current auction state
      try {
        const auction = await auctionService.getAuction(parseInt(auctionId));
        if (auction) {
          const now = new Date();
          const timeRemaining = auction.auctionEndsAt
            ? Math.max(0, auction.auctionEndsAt.getTime() - now.getTime())
            : 0;

          socket.emit('auction:state', {
            auctionId: parseInt(auctionId),
            currentBid: auction.currentBid,
            auctionEndsAt: auction.auctionEndsAt,
            timeRemainingMs: timeRemaining,
            bidsCount: auction.bids.length,
            recentBids: auction.bids.slice(0, 5),
            extensionCount: auction.extensionCount,
            autoExtendEnabled: auction.autoExtendEnabled,
            status: auction.status,
          });
        }
      } catch (error) {
        console.error(`Error fetching auction ${auctionId}:`, error);
      }
    });

    // Leave auction room
    socket.on('auction:unsubscribe', (data: { auctionId: string | number }) => {
      const auctionId = String(data.auctionId);
      socket.leave(`auction:${auctionId}`);
      console.log(`User ${socket.id} unsubscribed from auction ${auctionId}`);
    });

    // Join user-specific room for personal notifications (outbid alerts, etc.)
    socket.on('user:subscribe', (data: { userId: string | number }) => {
      const userId = String(data.userId);
      socket.join(`user:${userId}`);
      console.log(`User ${socket.id} subscribed to user channel ${userId}`);
    });

    // Leave user room
    socket.on('user:unsubscribe', (data: { userId: string | number }) => {
      const userId = String(data.userId);
      socket.leave(`user:${userId}`);
      console.log(`User ${socket.id} unsubscribed from user channel ${userId}`);
    });

    // Handle real-time bid placement via WebSocket
    socket.on('bid:place', async (data: {
      auctionId: string | number;
      amount: number;
      userId: string | number;
    }) => {
      try {
        const listingId = parseInt(String(data.auctionId));
        const bidderId = parseInt(String(data.userId));
        const bidAmount = Number(data.amount);

        if (!Number.isFinite(listingId)) {
          throw new Error('Invalid auctionId');
        }
        if (!Number.isFinite(bidderId)) {
          throw new Error('Invalid userId');
        }
        if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
          throw new Error('Invalid bid amount');
        }

        const result = await auctionService.placeBid(
          listingId,
          bidderId,
          bidAmount
        );

        // Broadcast to auction room
        io.to(`auction:${listingId}`).emit('bid:placed', {
          auctionId: listingId,
          bid: {
            id: result.bid.id,
            amount: result.bid.amount,
            bidderId: result.bid.bidderId,
            bidder: result.bid.bidder,
            createdAt: result.bid.createdAt,
          },
          currentBid: result.auction.currentBid,
          auctionEndsAt: result.auction.auctionEndsAt,
          timestamp: new Date(),
        });

        // Notify outbid users
        for (const userId of result.outbidUsers) {
          io.to(`user:${userId}`).emit('bid:outbid', {
            auctionId: listingId,
            newHighestBid: result.auction.currentBid,
          });
        }

        // Emit extension event if auction was extended
        if (result.wasExtended && result.extensionInfo) {
          io.to(`auction:${listingId}`).emit('auction:extended', {
            auctionId: listingId,
            previousEndTime: result.extensionInfo.previousEndTime,
            newEndTime: result.extensionInfo.newEndTime,
            extensionNumber: result.extensionInfo.extensionNumber,
          });
        }

        // Confirm to the bidder
        socket.emit('bid:confirmed', {
          success: true,
          bid: result.bid,
          wasExtended: result.wasExtended,
        });

        // Process proxy bids
        const proxyResult = await auctionService.processProxyBids(
          listingId,
          Number(result.auction.currentBid),
          bidderId
        );

        if (proxyResult) {
          io.to(`auction:${listingId}`).emit('bid:placed', {
            auctionId: listingId,
            bid: proxyResult.bid,
            currentBid: proxyResult.auction.currentBid,
            auctionEndsAt: proxyResult.auction.auctionEndsAt,
            isProxyBid: true,
            timestamp: new Date(),
          });
        }
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('bid:rejected', {
          success: false,
          auctionId: data.auctionId,
          reason,
        });
      }
    });

    // Handle proxy bid setup via WebSocket
    socket.on('bid:proxy:setup', async (data: {
      auctionId: string | number;
      maxAmount: number;
      userId: string | number;
    }) => {
      try {
        const listingId = parseInt(String(data.auctionId));
        const bidderId = parseInt(String(data.userId));
        const maxAmount = Number(data.maxAmount);

        if (!Number.isFinite(listingId)) {
          throw new Error('Invalid auctionId');
        }
        if (!Number.isFinite(bidderId)) {
          throw new Error('Invalid userId');
        }
        if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
          throw new Error('Invalid maxAmount');
        }

        const proxyBid = await auctionService.setupProxyBid(
          listingId,
          bidderId,
          maxAmount
        );

        socket.emit('bid:proxy:confirmed', {
          success: true,
          proxyBid,
        });
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        socket.emit('bid:proxy:rejected', {
          success: false,
          reason,
        });
      }
    });

    // Request current auction time (for clock sync)
    socket.on('auction:sync', (data: { auctionId: string | number }) => {
      socket.emit('auction:time', {
        auctionId: data.auctionId,
        serverTime: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
