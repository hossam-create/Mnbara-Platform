
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { WalletService } from '../wallet.service';
import { ContractsService } from '../contracts.service';
import { DeploymentService } from '../deployment.service';
import { BlockchainModule } from '../blockchain.module';

// Use require instead of import for ethers to avoid Jest issues
const { ethers } = require('ethers');

describe('WalletService <-> ContractsService Integration', () => {
  let walletService: WalletService;
  let deploymentService: DeploymentService;
  let contractsService: ContractsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        BlockchainModule,
      ],
    }).compile();

    deploymentService = module.get<DeploymentService>(DeploymentService);
    contractsService = module.get<ContractsService>(ContractsService);
    walletService = new WalletService(contractsService);

    // Ensure contracts are loaded
    await deploymentService.loadDeploymentResults();
  });

  it('should be defined', () => {
    expect(walletService).toBeDefined();
    expect(contractsService).toBeDefined();
  });

  it('should fetch the MNBToken balance for a given address', async () => {
    // Address from the Hardhat node
    const userAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; 
    
    const balance = await walletService.getBalance(userAddress);

    console.log(`MNBToken balance for ${userAddress}: ${balance}`);

    // We expect the balance to be a string representing a number.
    expect(typeof balance).toBe('string');
    expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
  });
});
