import { Module } from '@nestjs/common';
import { GuaranteeRulesController } from './guarantee-rules.controller';
import { GuaranteeRulesService } from './guarantee-rules.service';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [GuaranteeRulesController],
  providers: [GuaranteeRulesService, DatabaseService, ConfigService],
  exports: [GuaranteeRulesService]
})
export class GuaranteeRulesModule {}
