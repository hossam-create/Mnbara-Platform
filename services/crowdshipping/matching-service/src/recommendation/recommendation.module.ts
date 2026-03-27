import { Module, forwardRef } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { CollaborativeFilteringService } from './algorithms/collaborative-filtering.service';
import { ContentBasedService } from './algorithms/content-based.service';
import { HybridRecommendationService } from './algorithms/hybrid-recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CacheModule } from '../common/cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    CollaborativeFilteringService,
    ContentBasedService,
    HybridRecommendationService,
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
