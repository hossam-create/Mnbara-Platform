import { Module } from '@nestjs/common';
import { EscrowKenyaController } from './escrow-kenya.controller';
import { EscrowKenyaService } from './escrow-kenya.service';

@Module({
  controllers: [EscrowKenyaController],
  providers: [EscrowKenyaService],
  exports: [EscrowKenyaService],
})
export class EscrowKenyaModule {}
