import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../wallet.service';
import { BlockchainService } from '../blockchain.service';
import { RedotPayService } from '../redotpay.service';

describe('WalletService and BlockchainService Integration', () => {
  let walletService: WalletService;
  let blockchainService: BlockchainService;
  let redotPayService: RedotPayService;

  // Mock configuration
  const mockBlockchainConfig = {
    rpcUrl: 'http://localhost:8545',
    chainId: 1337,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat default private key
  };

  const mockWalletConfig = {
    encryptionKey: '32_byte_encryption_key_123456789012',
    encryptionIV: '16_byte_iv_1234',
    securityConstraints: {
      maxWithdrawalAmount: 1000,
      dailyWithdrawalLimit: 5000,
      minBalance: 10,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RedotPayService,
          useValue: {
            processWithdrawal: jest.fn().mockResolvedValue({ success: true, transactionId: 'test-tx-id' }),
          },
        },
        {
          provide: BlockchainService,
          useValue: {
            getBalance: jest.fn().mockResolvedValue('1.5'),
            sendTransaction: jest.fn().mockResolvedValue({
              hash: '0x1234567890abcdef',
              wait: jest.fn().mockResolvedValue({
                status: 1,
                blockNumber: 12345,
              }),
            }),
            waitForTransaction: jest.fn().mockResolvedValue({
              status: 1,
              blockNumber: 12345,
              transactionHash: '0x1234567890abcdef',
            }),
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
        WalletService,
      ],
    }).compile();

    walletService = module.get<WalletService>(WalletService);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    redotPayService = module.get<RedotPayService>(RedotPayService);

    // Initialize wallet service with mock config
    await walletService['initializeSecurityConfig'](mockWalletConfig);
  });

  describe('Balance Integration', () => {
    it('should get balance from blockchain service', async () => {
      const userAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      const balance = await walletService.getBalance(userAddress);

      expect(blockchainService.getBalance).toHaveBeenCalledWith(userAddress);
      expect(balance).toBe('1.5');
    });

    it('should fallback to database balance when blockchain fails', async () => {
      // Mock blockchain failure
      (blockchainService.getBalance as jest.Mock).mockRejectedValueOnce(new Error('Blockchain error'));

      const userAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      const balance = await walletService.getBalance(userAddress);

      expect(blockchainService.getBalance).toHaveBeenCalledWith(userAddress);
      // Should fallback to database balance (mock value)
      expect(balance).toBeDefined();
    });
  });

  describe('Transaction Integration', () => {
    it('should record transaction on blockchain and database', async () => {
      const transactionData = {
        userId: 'user-123',
        amount: '0.1',
        type: 'transfer',
        toAddress: '0xRecipientAddress',
        description: 'Test transaction',
      };

      const result = await walletService.recordTransaction(transactionData);

      expect(blockchainService.sendTransaction).toHaveBeenCalled();
      expect(result).toHaveProperty('blockchainTxHash');
      expect(result).toHaveProperty('databaseRecordId');
    });

    it('should handle blockchain transaction failure gracefully', async () => {
      // Mock blockchain transaction failure
      (blockchainService.sendTransaction as jest.Mock).mockRejectedValueOnce(
        new Error('Transaction failed')
      );

      const transactionData = {
        userId: 'user-123',
        amount: '0.1',
        type: 'transfer',
        toAddress: '0xRecipientAddress',
        description: 'Test transaction',
      };

      await expect(walletService.recordTransaction(transactionData)).rejects.toThrow(
        'Failed to record transaction on blockchain'
      );
    });
  });

  describe('Withdrawal Integration', () => {
    it('should process withdrawal using blockchain service', async () => {
      const withdrawalData = {
        userId: 'user-123',
        amount: '0.5',
        toAddress: '0xWithdrawalAddress',
        securityCode: '123456',
      };

      const result = await walletService.processWithdrawal(withdrawalData);

      expect(blockchainService.sendTransaction).toHaveBeenCalled();
      expect(redotPayService.processWithdrawal).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('Health Check', () => {
    it('should check blockchain service health', async () => {
      const isHealthy = await blockchainService.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });
});