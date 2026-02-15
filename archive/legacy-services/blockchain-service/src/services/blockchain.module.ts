import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { ContractsService } from './contracts.service';
import { DeploymentService } from './deployment.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: BlockchainService,
      useFactory: (configService: ConfigService) => {
        const blockchainConfig = {
          rpcUrl: configService.get<string>('BLOCKCHAIN_RPC_URL', 'http://localhost:8545'),
          chainId: configService.get<number>('BLOCKCHAIN_CHAIN_ID', 1337),
          privateKey: configService.get<string>('BLOCKCHAIN_PRIVATE_KEY'),
        };
        return new BlockchainService(blockchainConfig);
      },
      inject: [ConfigService],
    },
    ContractsService,
    DeploymentService,
  ],
  exports: [BlockchainService, ContractsService, DeploymentService],
})
export class BlockchainModule implements OnModuleInit {
  constructor(private readonly deploymentService: DeploymentService) {}

  async onModuleInit() {
    await this.deploymentService.loadDeploymentResults();
  }
}