import { Module } from '@nestjs/common';
import { ForexController } from '../controllers/forex.controller';
import { ConversionService } from '../services/conversion.service';

@Module({
  controllers: [ForexController],
  providers: [ConversionService],
  exports: [ConversionService],
})
export class ConversionModule {}
