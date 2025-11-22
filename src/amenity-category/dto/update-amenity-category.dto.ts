// dto/update-amenity-category.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AmenityApplyTo } from '../entities/amenity-category.entity';

class AmenityItemUpdateDto {
  @ApiPropertyOptional({ example: '1', description: 'ID của tiện ích (nếu có)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'WiFi miễn phí' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateAmenityCategoryDto {
  @ApiProperty({ example: 'Tiện ích cơ bản' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: AmenityApplyTo.Hotel, enum: AmenityApplyTo })
  @IsEnum(AmenityApplyTo)
  applies_to: AmenityApplyTo;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ 
    type: [AmenityItemUpdateDto],
    example: [
      { id: '1', name: 'WiFi miễn phí' },
      { name: 'Điều hòa mới' }
    ]
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AmenityItemUpdateDto)
  amenities: AmenityItemUpdateDto[];
}