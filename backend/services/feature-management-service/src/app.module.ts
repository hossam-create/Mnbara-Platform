import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FeatureModule } from './feature/feature.module';
import { ReleaseModule } from './release/release.module';
import { ConfigMgmtModule } from './config-mgmt/config-mgmt.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FeatureModule,
    ReleaseModule,
    ConfigMgmtModule,
  ],
})
export class AppModule {}
