import { Module } from '@nestjs/common';
import { P2PSwapService } from './p2p-swap.service';
import { P2PSwapController } from './p2p-swap.controller';
import { BlockchainService } from '../../services/blockchain.service';
import { ContractsService } from '../../services/contracts.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [P2PSwapController],
  providers: [P2PSwapService, BlockchainService, ContractsService],
  exports: [P2PSwapService]
})
export class P2PSwapModule {}