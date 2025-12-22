import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MatchingModule } from './matching/matching.module';
import { GeoModule } from './geo/geo.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CacheModule,
    MatchingModule,
    GeoModule,
  ],
})
export class AppModule {}
