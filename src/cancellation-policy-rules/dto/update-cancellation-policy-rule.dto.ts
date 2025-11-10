import { PartialType } from '@nestjs/swagger';
import { CreateCancellationPolicyRuleDto } from './create-cancellation-policy-rule.dto';

export class UpdateCancellationPolicyRuleDto extends PartialType(CreateCancellationPolicyRuleDto) {}
