import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { LedgerModule } from './ledger/ledger.module';
import { TransferModule } from './transfer/transfer.module';
import { EscrowModule } from './escrow/escrow.module';
import { ConversionModule } from './conversion/conversion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    WalletModule,
    LedgerModule,
    TransferModule,
    EscrowModule,
    ConversionModule,
  ],
})
export class AppModule {}
