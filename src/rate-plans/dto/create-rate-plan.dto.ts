import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MealPlanType, RatePlanType } from '../entities/rate-plan.entity';

export class CreateRatePlanDto {
  @ApiProperty({ description: 'Room Type ID', example: '10' })
  @IsString()
  @IsNotEmpty()
  room_type_id: string;

  @ApiProperty({ example: 'Flexible' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '1200000.00' })
  @IsString()
  @IsNotEmpty()
  price_amount: string;

  @ApiPropertyOptional({ example: 'Bao gồm bữa sáng, hủy miễn phí trước 24h' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MealPlanType, example: MealPlanType.BREAKFAST })
  @IsOptional()
  @IsEnum(MealPlanType)
  meal_plan?: MealPlanType;

  @ApiProperty({ enum: RatePlanType, example: RatePlanType.REFUNDABLE })
  @IsEnum(RatePlanType)
  type: RatePlanType;

  @ApiProperty({ example: 2, default: 2 })
  @IsInt()
  @Min(1)
  @Max(10)
  base_occupancy: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(10)
  max_occupancy: number;

  @ApiProperty({ example: '0.00' })
  @IsString()
  extra_adult_fee: string;

  @ApiProperty({ example: '0.00' })
  @IsString()
  extra_child_fee: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  prepayment_required: boolean;
}
