import { Module, OnModuleInit } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingEngineService } from './matching-engine.service';

@Module({
  controllers: [MatchingController],
  providers: [MatchingEngineService],
  exports: [MatchingEngineService],
})
export class MatchingModule implements OnModuleInit {
  constructor(private readonly matchingEngine: MatchingEngineService) {}

  onModuleInit() {
    this.matchingEngine.start();
  }
}
