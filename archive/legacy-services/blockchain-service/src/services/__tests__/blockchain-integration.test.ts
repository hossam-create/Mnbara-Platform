import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainModule } from '../blockchain.module';
import { BlockchainService } from '../blockchain.service';
import { ContractsService } from '../contracts.service';
import { DeploymentService } from '../deployment.service';
import { ConfigService } from '@nestjs/config';

describe('Blockchain Integration Test', () => {
  let blockchainService: BlockchainService;
  let contractsService: ContractsService;
  let deploymentService: DeploymentService;
  let configService: ConfigService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BlockchainModule],
    }).compile();

    blockchainService = module.get<BlockchainService>(BlockchainService);
    contractsService = module.get<ContractsService>(ContractsService);
    deploymentService = module.get<DeploymentService>(DeploymentService);
    configService = module.get<ConfigService>(ConfigService);

    // Initialize services
    await blockchainService.initialize();
    await contractsService.initialize();
  });

  describe('Blockchain Service Integration', () => {
    it('should connect to local blockchain network', async () => {
      const health = await blockchainService.healthCheck();
      expect(health.isHealthy).toBe(true);
      expect(health.networkId).toBe(31337);
      expect(health.chainId).toBe(31337);
    });

    it('should get account balance', async () => {
      const address = await blockchainService.getWalletAddress();
      const balance = await blockchainService.getBalance(address);
      
      expect(balance.balance).toBeDefined();
      expect(parseFloat(balance.balance)).toBeGreaterThan(0);
    });

    it('should get current block number', async () => {
      const blockNumber = await blockchainService.getCurrentBlockNumber();
      expect(blockNumber).toBeGreaterThan(0);
    });
  });

  describe('Contracts Service Integration', () => {
    it('should initialize all contract instances', async () => {
      const contracts = contractsService.getAllContracts();
      
      expect(contracts.MNBToken).toBeDefined();
      expect(contracts.MNBWallet).toBeDefined();
      expect(contracts.MNBExchange).toBeDefined();
      expect(contracts.MNBGovernance).toBeDefined();
      expect(contracts.MNBStaking).toBeDefined();
    });

    it('should read from MNBToken contract', async () => {
      const name = await contractsService.readContract('MNBToken', 'name');
      const symbol = await contractsService.readContract('MNBToken', 'symbol');
      const decimals = await contractsService.readContract('MNBToken', 'decimals');
      
      expect(name).toBe('Mnbara Token');
      expect(symbol).toBe('MNB');
      expect(decimals).toBe(18);
    });

    it('should get token balance for owner', async () => {
      const owner = await blockchainService.getWalletAddress();
      const balance = await contractsService.readContract(
        'MNBToken',
        'balanceOf',
        [owner]
      );
      
      expect(balance).toBeDefined();
      expect(parseInt(balance.toString())).toBeGreaterThan(0);
    });
  });

  describe('Deployment Service Integration', () => {
    it('should load deployment results', async () => {
      const results = await deploymentService.loadDeploymentResults();
      
      expect(results).toBeDefined();
      expect(results.MNBToken).toBeDefined();
      expect(results.MNBToken.address).toBe('0x5FbDB2315678afecb367f032d93F642f64180aa3');
      expect(results.MNBWallet.address).toBe('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
      expect(results.MNBExchange.address).toBe('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0');
      expect(results.MNBGovernance.address).toBe('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');
      expect(results.MNBStaking.address).toBe('0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9');
    });

    it('should verify all contracts are deployed', async () => {
      const isDeployed = await deploymentService.areAllContractsDeployed();
      expect(isDeployed).toBe(true);
    });
  });

  describe('Advanced Contract Interactions', () => {
    it('should transfer tokens between accounts', async () => {
      const owner = await blockchainService.getWalletAddress();
      const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Second account
      
      const initialBalance = await contractsService.readContract(
        'MNBToken',
        'balanceOf',
        [recipient]
      );
      
      // Transfer 100 tokens
      const transferAmount = BigInt(100 * 10 ** 18);
      const tx = await contractsService.writeContract(
        'MNBToken',
        'transfer',
        [recipient, transferAmount]
      );
      
      expect(tx.hash).toBeDefined();
      expect(tx.blockNumber).toBeDefined();
      
      // Check new balance
      const newBalance = await contractsService.readContract(
        'MNBToken',
        'balanceOf',
        [recipient]
      );
      
      expect(BigInt(newBalance.toString()) - BigInt(initialBalance.toString())).toBe(transferAmount);
    });

    it('should create exchange pair', async () => {
      const tx = await contractsService.writeContract(
        'MNBExchange',
        'createPair',
        ['0x5FbDB2315678afecb367f032d93F642f64180aa3', '0x0000000000000000000000000000000000000000'] // MNB/ETH pair
      );
      
      expect(tx.hash).toBeDefined();
      expect(tx.blockNumber).toBeDefined();
    });

    it('should interact with governance contract', async () => {
      const proposalCount = await contractsService.readContract(
        'MNBGovernance',
        'proposalCount'
      );
      
      expect(proposalCount).toBeDefined();
    });
  });

  describe('Wallet Integration', () => {
    it('should create wallet for user', async () => {
      const userAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
      
      const tx = await contractsService.writeContract(
        'MNBWallet',
        'createWallet',
        [userAddress]
      );
      
      expect(tx.hash).toBeDefined();
      
      // Verify wallet creation
      const hasWallet = await contractsService.readContract(
        'MNBWallet',
        'hasWallet',
        [userAddress]
      );
      
      expect(hasWallet).toBe(true);
    });
  });

  afterAll(async () => {
    // Cleanup
  });
});