// src/hotel/dto/list-hotels.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { HotelApprovalStatus } from '../entities/hotel.entity';

export class ListHotelsDto {
  @IsOptional()
  @IsString()
  q?: string;

  // City text filter (nếu vẫn cần)
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  provinceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  wardId?: number;

  @IsOptional()
  @IsEnum(HotelApprovalStatus)
  status?: HotelApprovalStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  orderBy?: string = 'created_at';

  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  starMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  starMax?: number;
}