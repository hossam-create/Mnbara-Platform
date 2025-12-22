import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DatabaseService } from '../../database/database.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { AuctionBlockchainService } from './auction-blockchain.service';

@Injectable()
export class AuctionService {
  constructor(
    private readonly db: DatabaseService,
    @InjectQueue('auction-queue') private auctionQueue: Queue,
    private readonly blockchainService: AuctionBlockchainService,
  ) {}

  /**
   * Create a new auction listing
   */
  async createListing(sellerId: number, dto: CreateListingDto) {
    // Validation: Buy Now price must be higher than starting price
    if (dto.buyNowPrice && dto.buyNowPrice <= dto.startingPrice) {
      throw new BadRequestException('Buy Now price must be higher than starting price');
    }

    // Insert listing
    const listing = await this.db.insert('auction_listings', {
      seller_id: sellerId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      starting_price: dto.startingPrice,
      reserve_price: dto.reservePrice,
      buy_now_price: dto.buyNowPrice,
      current_price: dto.startingPrice,
      listing_type: dto.listingType,
      end_time: new Date(dto.endTime),
      status: 'active',
    });

    // Schedule auto-close job
    const endTime = new Date(dto.endTime);
    const delay = endTime.getTime() - Date.now();
    await this.auctionQueue.add('close-auction', { listingId: listing.id }, { delay });

    return listing;
  }

  /**
   * Get listing by ID
   */
  async getListing(id: number) {
    const listing = await this.db.findOne('auction_listings', { id });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Get current winning bid
    const highestBid = await this.db.query(
      'SELECT * FROM bids WHERE listing_id = $1 ORDER BY amount DESC LIMIT 1',
      [id],
    );

    return {
      ...listing,
      highestBid: highestBid.rows[0] || null,
    };
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(userId: number, dto: PlaceBidDto) {
    const listing = await this.getListing(dto.listingId);

    // Check if auction is still active
    if (listing.status !== 'active') {
      throw new BadRequestException('Auction is not active');
    }

    if (new Date() > new Date(listing.end_time)) {
      throw new BadRequestException('Auction has ended');
    }

    // Check if bid is higher than current price
    const minimumBid = listing.current_price + 0.5; // Increment by $0.50
    if (dto.amount < minimumBid) {
      throw new BadRequestException(`Bid must be at least $${minimumBid}`);
    }

    // Check seller can't bid on own auction
    if (userId === listing.seller_id) {
      throw new BadRequestException('Cannot bid on your own auction');
    }

    // Place the bid
    const bid = await this.db.insert('bids', {
      listing_id: dto.listingId,
      bidder_id: userId,
      amount: dto.amount,
      is_auto_bid: dto.isAutoBid || false,
      max_amount: dto.maxAmount,
      status: 'winning',
    });

    // Update listing current price
    await this.db.update('auction_listings', { id: dto.listingId }, {
      current_price: dto.amount,
      total_bids: listing.total_bids + 1,
    });

    // Mark previous bids as outbid
    await this.db.query(
      'UPDATE bids SET status = \'outbid\' WHERE listing_id = $1 AND id != $2 AND status = \'winning\'',
      [dto.listingId, bid.id],
    );

    return bid;
  }

  /**
   * Auto-close auction (called by BullMQ worker)
   */
  async closeAuction(listingId: number) {
    const listing = await this.getListing(listingId);

    // Get highest bid
    const highestBid = await this.db.query(
      'SELECT * FROM bids WHERE listing_id = $1 ORDER BY amount DESC LIMIT 1',
      [listingId],
    );

    const winner = highestBid.rows[0];

    // Check if reserve price was met
    if (listing.reserve_price && (!winner || winner.amount < listing.reserve_price)) {
      await this.db.update('auction_listings', { id: listingId }, {
        status: 'completed',
        winner_id: null, // No winner, reserve not met
      });
      return { success: false, reason: 'Reserve price not met' };
    }

    // Update listing
    await this.db.update('auction_listings', { id: listingId }, {
      status: 'completed',
      winner_id: winner?.bidder_id,
    });

    // Update winning bid
    if (winner) {
      await this.db.update('bids', { id: winner.id }, { status: 'won' });

      // Mark all other bids as lost
      await this.db.query(
        'UPDATE bids SET status = \'lost\' WHERE listing_id = $1 AND id != $2',
        [listingId, winner.id],
      );

      // 🆕 Lock funds in blockchain escrow
      if (this.blockchainService.isInitialized()) {
        try {
          const escrowResult = await this.blockchainService.lockFunds(
            listingId,
            winner.bidder_wallet_address || '0x0000000000000000000000000000000000000000',
            listing.seller_wallet_address || '0x0000000000000000000000000000000000000000',
            winner.amount.toString(),
            true // Use native token (ETH/MATIC)
          );

          if (escrowResult.success) {
            // Save blockchain transaction to database
            await this.db.insert('escrow_transactions', {
              listing_id: listingId,
              buyer_id: winner.bidder_id,
              seller_id: listing.seller_id,
              amount: winner.amount,
              transaction_hash: escrowResult.transactionHash,
              block_number: escrowResult.blockNumber,
              escrow_address: escrowResult.escrowAddress,
              status: 'locked',
              created_at: new Date(),
            });
          }
        } catch (error) {
          console.error('Blockchain escrow error:', error);
          // Continue even if blockchain fails (fallback to traditional payment)
        }
      }
    }

    return { success: true, winner };
  }

  /**
   * Buy Now (instant purchase)
   */
  async buyNow(userId: number, listingId: number) {
    const listing = await this.getListing(listingId);

    if (!listing.buy_now_price) {
      throw new BadRequestException('Buy Now not available for this listing');
    }

    if (listing.status !== 'active') {
      throw new BadRequestException('Listing is not active');
    }

    // Update listing
    await this.db.update('auction_listings', { id: listingId }, {
      status: 'completed',
      winner_id: userId,
      current_price: listing.buy_now_price,
    });

    // Create a "Buy Now" bid
    const bid = await this.db.insert('bids', {
      listing_id: listingId,
      bidder_id: userId,
      amount: listing.buy_now_price,
      status: 'won',
      is_auto_bid: false,
    });

    // 🆕 Lock funds in blockchain escrow for Buy Now
    if (this.blockchainService.isInitialized()) {
      try {
        const escrowResult = await this.blockchainService.lockFunds(
          listingId,
          '0x0000000000000000000000000000000000000000', // buyer wallet
          listing.seller_wallet_address || '0x0000000000000000000000000000000000000000',
          listing.buy_now_price.toString(),
          true
        );

        if (escrowResult.success) {
          await this.db.insert('escrow_transactions', {
            listing_id: listingId,
            buyer_id: userId,
            seller_id: listing.seller_id,
            amount: listing.buy_now_price,
            transaction_hash: escrowResult.transactionHash,
            block_number: escrowResult.blockNumber,
            escrow_address: escrowResult.escrowAddress,
            status: 'locked',
            created_at: new Date(),
          });
        }
      } catch (error) {
        console.error('Blockchain escrow error (Buy Now):', error);
      }
    }

    return bid;
  }
}
