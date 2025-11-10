import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PenaltyType } from '../entities/cancellation-policy.entity';

export class CreateCancellationPolicyDto {
  @IsNumberString()
  hotel_id: string;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(PenaltyType)
  no_show_penalty_type?: PenaltyType = PenaltyType.PERCENT;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  no_show_penalty_value?: number = 100; 
}
