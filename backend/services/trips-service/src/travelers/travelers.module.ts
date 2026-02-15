import { Module } from '@nestjs/common';
import { TravelersController } from './travelers.controller';
import { TravelersService } from './travelers.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CountryLayerClient } from './countryLayerClient';

@Module({
  imports: [PrismaModule],
  controllers: [TravelersController],
  providers: [TravelersService, CountryLayerClient],
  exports: [TravelersService, CountryLayerClient],
})
export class TravelersModule {}