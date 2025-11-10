import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  Min,
} from 'class-validator';
import { PenaltyType } from 'src/cancellation-policies/entities/cancellation-policy.entity';

export class ListCancellationPolicyRulesDto {
  @IsOptional()
  @IsNumberString()
  policy_id?: string;

  @IsOptional()
  @IsEnum(PenaltyType)
  penalty_type?: PenaltyType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  days_from?: number; // lower bound inclusive

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  days_to?: number; // upper bound inclusive

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsIn([
    'id',
    'policy_id',
    'days_before_checkin',
    'penalty_type',
    'penalty_value',
  ])
  orderBy?:
    | 'id'
    | 'policy_id'
    | 'days_before_checkin'
    | 'penalty_type'
    | 'penalty_value' = 'days_before_checkin';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}