import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MealPlanType, RatePlanType } from '../entities/rate-plan.entity';

export class ListRatePlansDto {
  @IsOptional()
  @IsNumberString()
  hotel_id?: string;

  @IsOptional()
  @IsNumberString()
  room_type_id?: string;

  @IsOptional()
  @IsNumberString()
  cancellation_policy_id?: string;

  @IsOptional()
  @IsEnum(MealPlanType)
  meal_plan?: MealPlanType;

  @IsOptional()
  @IsEnum(RatePlanType)
  type?: RatePlanType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  q?: string; // search name/description

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsIn([
    'id',
    'hotel_id',
    'room_type_id',
    'name',
    'meal_plan',
    'type',
    'base_occupancy',
    'max_occupancy',
    'is_active',
    'created_at',
    'updated_at',
  ])
  orderBy?:
    | 'id'
    | 'hotel_id'
    | 'room_type_id'
    | 'name'
    | 'meal_plan'
    | 'type'
    | 'base_occupancy'
    | 'max_occupancy'
    | 'is_active'
    | 'created_at'
    | 'updated_at' = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}