import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { StakingController } from './staking.controller';
import { EscrowController } from './escrow.controller';
import { GovernanceController } from './governance.controller';
import { ContractsService } from '../../services/contracts.service';
import { BlockchainService } from '../../services/blockchain.service';
import { AuctionBlockchainService } from '../auction/auction-blockchain.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [
    TokenController,
    StakingController,
    EscrowController,
    GovernanceController,
  ],
  providers: [
    BlockchainService,
    ContractsService,
    AuctionBlockchainService,
  ],
  exports: [
    BlockchainService,
    ContractsService,
    AuctionBlockchainService,
  ],
})
export class BlockchainModule {}
