import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { WalletClientService } from '../clients/wallet-client.service';

@Module({
  controllers: [EscrowController],
  providers: [EscrowService, WalletClientService],
  exports: [EscrowService, WalletClientService],
})
export class EscrowModule {}
