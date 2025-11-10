import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNumberString, IsOptional, IsString, Max, Min } from 'class-validator';
import { PenaltyType } from '../entities/cancellation-policy.entity';

export class ListCancellationPoliciesDto {
  @IsOptional()
  @IsNumberString()
  hotel_id?: string;

  @IsOptional()
  @IsString()
  q?: string; // search by name/description (MySQL LIKE)

  @IsOptional()
  @IsEnum(PenaltyType)
  no_show_penalty_type?: PenaltyType;

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
  @IsIn(['id', 'hotel_id', 'name', 'no_show_penalty_type', 'no_show_penalty_value', 'created_at', 'updated_at'])
  orderBy?:
    | 'id'
    | 'hotel_id'
    | 'name'
    | 'no_show_penalty_type'
    | 'no_show_penalty_value'
    | 'created_at'
    | 'updated_at' = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}