import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { MealPlanType, RatePlanType } from '../entities/rate-plan.entity';

export class CreateRatePlanDto {
  @IsNumberString()
  hotel_id: string;

  @IsNumberString()
  room_type_id: string;

  @IsString()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(MealPlanType)
  meal_plan?: MealPlanType | null;

  @IsEnum(RatePlanType)
  type: RatePlanType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  base_occupancy: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_occupancy: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  extra_adult_fee?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  extra_child_fee?: number = 0;

  @IsOptional()
  @IsNumberString()
  cancellation_policy_id?: string | null;

  @IsOptional()
  @IsBoolean()
  prepayment_required?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  min_los?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_los?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}