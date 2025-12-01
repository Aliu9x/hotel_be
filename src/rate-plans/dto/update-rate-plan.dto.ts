import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MealPlanType, RatePlanType } from '../entities/rate-plan.entity';

export class UpdateRatePlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  price_amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MealPlanType })
  @IsOptional()
  @IsEnum(MealPlanType)
  meal_plan?: MealPlanType;

  @ApiPropertyOptional({ enum: RatePlanType })
  @IsOptional()
  @IsEnum(RatePlanType)
  type?: RatePlanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  base_occupancy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  max_occupancy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  extra_adult_fee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  extra_child_fee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  prepayment_required?: boolean;
}
