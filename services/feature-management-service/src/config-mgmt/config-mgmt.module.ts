import { Module } from '@nestjs/common';
import { ConfigMgmtController } from './config-mgmt.controller';
import { ConfigMgmtService } from './config-mgmt.service';

@Module({
  controllers: [ConfigMgmtController],
  providers: [ConfigMgmtService],
  exports: [ConfigMgmtService],
})
export class ConfigMgmtModule {}
