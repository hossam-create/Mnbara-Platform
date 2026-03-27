import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { CountryLayerClient } from './countryLayerClient';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CacheModule } from '../common/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [MatchingController],
  providers: [MatchingService, CountryLayerClient],
  exports: [MatchingService, CountryLayerClient],
})
export class MatchingModule {}
