import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TransferModule } from './transfer/transfer.module';
import { MatchingModule } from './matching/matching.module';
import { RatesModule } from './rates/rates.module';
import { LocationModule } from './location/location.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TransferModule,
    MatchingModule,
    RatesModule,
    LocationModule,
  ],
})
export class AppModule {}
