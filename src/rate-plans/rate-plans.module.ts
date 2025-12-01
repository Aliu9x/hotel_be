import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlan } from './entities/rate-plan.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { CancellationPolicy } from 'src/cancellation-policies/entities/cancellation-policy.entity';
import { RatePlanController } from './rate-plans.controller';
import { RatePlanService } from './rate-plans.service';

@Module({
  imports: [TypeOrmModule.forFeature([RatePlan, RoomType, CancellationPolicy])],
  controllers: [RatePlanController],
  providers: [RatePlanService],
  exports: [RatePlanService],
})
export class RatePlansModule {}
