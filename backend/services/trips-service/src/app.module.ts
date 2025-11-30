import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TripsModule } from './trips/trips.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CacheModule,
    TripsModule,
  ],
})
export class AppModule {}
