import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AmenityApplyTo } from '../entities/amenity.entity';

export class ListAmenitiesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(AmenityApplyTo)
  applies_to?: AmenityApplyTo;

  @IsOptional()
  @Transform   (({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

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
  limit?: number = 10;

  @IsOptional()
  @IsIn([
    'id',
    'name',
    'category',
    'applies_to',
    'is_active',
    'created_at',
    'updated_at',
  ])
  orderBy?:
    | 'id'
    | 'name'
    | 'category'
    | 'applies_to'
    | 'is_active'
    | 'created_at'
    | 'updated_at' = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}
