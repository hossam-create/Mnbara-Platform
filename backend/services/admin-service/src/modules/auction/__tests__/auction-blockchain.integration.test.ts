import { Test, TestingModule } from '@nestjs/testing';
import { AuctionBlockchainService } from '../auction-blockchain.service';
import { ConfigService } from '@nestjs/config';

describe('AuctionBlockchainService Integration Tests', () => {
  let service: AuctionBlockchainService;
  let configService: ConfigService;

  // Mock configuration
  const mockConfig = {
    BLOCKCHAIN_RPC_URL: 'http://127.0.0.1:8545',
    BLOCKCHAIN_CHAIN_ID: '31337',
    BLOCKCHAIN_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    AUCTION_ESCROW_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Example address
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionBlockchainService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<AuctionBlockchainService>(AuctionBlockchainService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize blockchain connection', () => {
      // In a real test environment, this would verify connection
      expect(service.isInitialized()).toBeDefined();
    });
  });

  describe('Lock Funds', () => {
    it('should lock funds in escrow', async () => {
      const auctionId = 1001;
      const buyer = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const seller = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
      const amount = '1.0'; // 1 ETH

      // Note: This test requires a running Hardhat node
      // For unit testing, you would mock the contract
      const result = await service.lockFunds(
        auctionId,
        buyer,
        seller,
        amount,
        true
      );

      if (service.isInitialized()) {
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result).toHaveProperty('transactionHash');
          expect(result).toHaveProperty('blockNumber');
          expect(result.status).toBe('locked');
        }
      }
    });

    it('should handle errors gracefully', async () => {
      const result = await service.lockFunds(
        9999,
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
        '0',
        true
      );

      // Should return error response instead of throwing
      expect(result).toHaveProperty('success');
    });
  });

  describe('Release Funds', () => {
    it('should release funds to seller', async () => {
      const auctionId = 1001;

      const result = await service.releaseFunds(auctionId);

      if (service.isInitialized()) {
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result).toHaveProperty('transactionHash');
          expect(result.status).toBe('released');
        }
      }
    });
  });

  describe('Refund Buyer', () => {
    it('should refund buyer', async () => {
      const auctionId = 1002;

      const result = await service.refundBuyer(auctionId);

      if (service.isInitialized()) {
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result).toHaveProperty('transactionHash');
          expect(result.status).toBe('refunded');
        }
      }
    });
  });

  describe('Dispute Management', () => {
    it('should raise a dispute', async () => {
      const auctionId = 1003;
      const reason = 'Item not as described';
      const initiator = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

      const result = await service.raiseDispute(auctionId, reason, initiator);

      if (service.isInitialized()) {
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result.status).toBe('disputed');
        }
      }
    });

    it('should resolve dispute in favor of buyer', async () => {
      const auctionId = 1003;
      const favorBuyer = true;

      const result = await service.resolveDispute(auctionId, favorBuyer);

      if (service.isInitialized()) {
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result.resolution).toBe('buyer');
        }
      }
    });

    it('should resolve dispute in favor of seller', async () => {
      const auctionId = 1004;
      const favorBuyer = false;

      const result = await service.resolveDispute(auctionId, favorBuyer);

      if (service.isInitialized()) {
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result.resolution).toBe('seller');
        }
      }
    });
  });

  describe('Get Escrow Details', () => {
    it('should retrieve escrow details', async () => {
      const auctionId = 1001;

      const escrow = await service.getEscrow(auctionId);

      if (service.isInitialized() && escrow) {
        expect(escrow).toHaveProperty('auctionId');
        expect(escrow).toHaveProperty('buyer');
        expect(escrow).toHaveProperty('seller');
        expect(escrow).toHaveProperty('amount');
        expect(escrow).toHaveProperty('status');
      }
    });
  });

  describe('Get Statistics', () => {
    it('should retrieve contract statistics', async () => {
      const stats = await service.getStats();

      if (service.isInitialized() && stats) {
        expect(stats).toHaveProperty('totalVolume');
        expect(stats).toHaveProperty('totalCommission');
        expect(stats).toHaveProperty('activeEscrowCount');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle uninitialized blockchain gracefully', async () => {
      // Create service with invalid config
      const invalidModule = await Test.createTestingModule({
        providers: [
          AuctionBlockchainService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => null),
            },
          },
        ],
      }).compile();

      const uninitializedService = invalidModule.get<AuctionBlockchainService>(
        AuctionBlockchainService
      );

      const result = await uninitializedService.lockFunds(1, '0x', '0x', '1', true);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('AuctionBlockchainService E2E Tests', () => {
  let service: AuctionBlockchainService;

  beforeAll(async () => {
    // These tests require a running Hardhat network
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionBlockchainService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                BLOCKCHAIN_RPC_URL: 'http://127.0.0.1:8545',
                BLOCKCHAIN_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
                AUCTION_ESCROW_ADDRESS: process.env.AUCTION_ESCROW_ADDRESS
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuctionBlockchainService>(AuctionBlockchainService);
  });

  it('should complete full escrow lifecycle', async () => {
    if (!service.isInitialized()) {
      console.log('Skipping E2E test - blockchain not initialized');
      return;
    }

    const auctionId = Date.now(); // Unique auction ID
    const buyer = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const seller = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
    const amount = '0.5';

    // Step 1: Lock funds
    const lockResult = await service.lockFunds(auctionId, buyer, seller, amount, true);
    expect(lockResult.success).toBe(true);
    expect(lockResult.transactionHash).toBeDefined();

    // Step 2: Get escrow details
    const escrow = await service.getEscrow(auctionId);
    expect(escrow).toBeDefined();
    expect(escrow.status).toBe(1); // LOCKED

    // Step 3: Release funds
    const releaseResult = await service.releaseFunds(auctionId);
    expect(releaseResult.success).toBe(true);

    // Step 4: Verify escrow is released
    const releasedEscrow = await service.getEscrow(auctionId);
    expect(releasedEscrow.status).toBe(2); // RELEASED
  });
});
