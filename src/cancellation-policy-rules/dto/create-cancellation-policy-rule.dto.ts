import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsNumberString,
  IsOptional,
  Min,
  IsPositive,
} from 'class-validator';
import { PenaltyType } from 'src/cancellation-policies/entities/cancellation-policy.entity';

export class CreateCancellationPolicyRuleDto {
  @IsNumberString()
  policy_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  days_before_checkin: number;

  @IsEnum(PenaltyType)
  penalty_type: PenaltyType;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  penalty_value: number;
}