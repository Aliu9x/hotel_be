import { Module } from '@nestjs/common';
import { RatePlansService } from './rate-plans.service';
import { RatePlansController } from './rate-plans.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatePlan } from './entities/rate-plan.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { CancellationPolicy } from 'src/cancellation-policies/entities/cancellation-policy.entity';

@Module({
imports: [TypeOrmModule.forFeature([RatePlan, RoomType, CancellationPolicy])],
  controllers: [RatePlansController],
  providers: [RatePlansService],
  exports: [RatePlansService],
})
export class RatePlansModule {}
