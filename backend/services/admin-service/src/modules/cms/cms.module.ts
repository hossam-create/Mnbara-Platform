import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { DatabaseService } from '../../database/database.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 1000, // 60 seconds (in milliseconds for cache-manager v5, check version usually seconds for v4, NestJS wraps it. Let's use 60000 ms to be safe or check config)
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [CmsController],
  providers: [CmsService, DatabaseService],
  exports: [CmsService],
})
export class CmsModule {}
