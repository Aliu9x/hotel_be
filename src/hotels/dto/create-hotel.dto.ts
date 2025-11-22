// src/hotel/dto/create-hotel.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  MaxLength,
  MinLength,
  Min,
  Max,
  IsInt,
  IsNumberString,
} from 'class-validator';
import { HotelApprovalStatus } from '../entities/hotel.entity';

export class CreateHotelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNumberString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address_line?: string;

  // IDs thay vì text nhập tay
  @IsOptional()
  @IsInt()
  province_id?: number;

  @IsOptional()
  @IsInt()
  district_id?: number;

  @IsOptional()
  @IsInt()
  ward_id?: number;

  // Nếu vẫn cho nhập city riêng (không bắt buộc)
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  star_rating?: number;

  @ApiPropertyOptional({
    example: HotelApprovalStatus.PENDING,
    enum: HotelApprovalStatus,
    default: HotelApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(HotelApprovalStatus)
  approval_status?: HotelApprovalStatus;
}
