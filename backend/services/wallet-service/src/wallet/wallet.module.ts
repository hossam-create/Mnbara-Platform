import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { ForexService } from '../transfer/forex.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, ForexService],
  exports: [WalletService],
})
export class WalletModule {}
