import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { ForexService } from '../services/forex.service';

@Module({
  controllers: [TransferController],
  providers: [TransferService, ForexService],
  exports: [TransferService],
})
export class TransferModule {}
