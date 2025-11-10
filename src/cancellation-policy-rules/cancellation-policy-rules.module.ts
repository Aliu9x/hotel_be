import { Module } from '@nestjs/common';
import { CancellationPolicyRulesService } from './cancellation-policy-rules.service';
import { CancellationPolicyRulesController } from './cancellation-policy-rules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CancellationPolicyRule } from './entities/cancellation-policy-rule.entity';
import { CancellationPolicy } from 'src/cancellation-policies/entities/cancellation-policy.entity';

@Module({
imports: [TypeOrmModule.forFeature([CancellationPolicyRule, CancellationPolicy])],
  controllers: [CancellationPolicyRulesController],
  providers: [CancellationPolicyRulesService],
  exports: [CancellationPolicyRulesService],
})
export class CancellationPolicyRulesModule {}
