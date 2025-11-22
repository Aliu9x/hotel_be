// src/hotel/dto/update-hotel.dto.ts

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { HotelApprovalStatus } from '../entities/hotel.entity';
import { CreateHotelDto } from './create-hotel.dto';

export class UpdateHotelDto extends PartialType(CreateHotelDto) {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  star_rating?: number;

  @IsOptional()
  @IsEnum(HotelApprovalStatus)
  approval_status?: HotelApprovalStatus;
}