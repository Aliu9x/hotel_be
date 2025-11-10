import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Price } from './entities/price.entity';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Price, RatePlan, RoomType])],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService],
})
export class PricesModule {}
