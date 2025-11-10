import { Module } from '@nestjs/common';
import { CancellationPoliciesService } from './cancellation-policies.service';
import { CancellationPoliciesController } from './cancellation-policies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationPolicy } from './entities/cancellation-policy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CancellationPolicy])],
  controllers: [CancellationPoliciesController],
  providers: [CancellationPoliciesService],
})
export class CancellationPoliciesModule {}
