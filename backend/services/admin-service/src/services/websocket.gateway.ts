import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class WebSocketGateway implements OnModuleInit {
  private server: Server;

  constructor(private readonly metricsService: MetricsService) {}

  onModuleInit() {
    this.server = new Server({
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
      },
    });

    this.server.listen(3001);
    console.log('WebSocket server listening on port 3001');

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.server.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle subscription to blockchain events
      socket.on('subscribe:transactions', (data) => {
        socket.join('transactions');
        console.log(`Client ${socket.id} subscribed to transactions`);
      });

      socket.on('subscribe:escrow', (data) => {
        socket.join('escrow');
        console.log(`Client ${socket.id} subscribed to escrow events`);
      });

      socket.on('subscribe:governance', (data) => {
        socket.join('governance');
        console.log(`Client ${socket.id} subscribed to governance`);
      });

      socket.on('subscribe:auction', (auctionId) => {
        socket.join(`auction:${auctionId}`);
        console.log(`Client ${socket.id} subscribed to auction ${auctionId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Emit transaction event
  emitTransaction(data: {
    txHash: string;
    contract: string;
    method: string;
    status: 'pending' | 'confirmed' | 'failed';
    from?: string;
    to?: string;
    value?: string;
    blockNumber?: number;
  }) {
    this.server.to('transactions').emit('transaction:update', data);
    
    // Record metric
    if (data.status === 'confirmed') {
      this.metricsService.recordTransaction(data.contract, data.method, 'success');
    } else if (data.status === 'failed') {
      this.metricsService.recordTransaction(data.contract, data.method, 'failure');
    }
  }

  // Emit escrow event
  emitEscrowEvent(data: {
    auctionId: number;
    event: 'locked' | 'released' | 'refunded' | 'disputed' | 'resolved';
    amount?: string;
    buyer?: string;
    seller?: string;
    txHash?: string;
  }) {
    this.server.to('escrow').emit('escrow:update', data);
    this.metricsService.recordEscrowOperation(data.event, 'success');
  }

  // Emit governance event
  emitGovernanceEvent(data: {
    proposalId: number;
    event: 'created' | 'voted' | 'executed' | 'defeated';
    voter?: string;
    support?: boolean;
    txHash?: string;
  }) {
    this.server.to('governance').emit('governance:update', data);
  }

  // Emit auction event
  emitAuctionEvent(auctionId: number, data: {
    event: 'bid_placed' | 'auction_ended' | 'item_shipped' | 'payment_released';
    bidder?: string;
    amount?: string;
    highestBid?: string;
    totalBids?: number;
  }) {
    this.server.to(`auction:${auctionId}`).emit('auction:update', {
      auctionId,
      ...data,
    });
  }

  // Emit price update
  emitPriceUpdate(data: {
    token: string;
    price: string;
    change24h: string;
    volume24h: string;
  }) {
    this.server.emit('price:update', data);
  }

  // Emit gas price update
  emitGasPrice(gasPriceGwei: number) {
    this.server.emit('gas:update', { gasPriceGwei });
    this.metricsService.updateGasPrice(gasPriceGwei);
  }

  // Emit error
  emitError(data: {
    contract: string;
    method: string;
    error: string;
    txHash?: string;
  }) {
    this.server.emit('error:blockchain', data);
    this.metricsService.recordError(data.contract, data.error);
  }

  // Get connected clients count
  getConnectedClients(): number {
    return this.server.sockets.sockets.size;
  }

  // Broadcast to all clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
