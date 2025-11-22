// src/category/dto/list-categories.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListCategoriesDto {
  @ApiPropertyOptional({ 
    description: 'Từ khóa tìm kiếm theo tên loại hoặc tên tiện ích', 
    example: 'wifi' 
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc theo áp dụng cho (Hotel, Room)', 
    example: 'Hotel',
    enum: ['Hotel', 'Room']
  })
  @IsOptional()
  @IsString()
  @IsIn(['Hotel', 'Room'])
  applies_to?: string;

  @ApiPropertyOptional({ 
    description: 'Trang hiện tại', 
    example: 1, 
    default: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Số lượng bản ghi mỗi trang', 
    example: 10, 
    default: 10 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Trường dùng để sắp xếp',
    example: 'created_at',
    enum: ['id', 'name_category', 'created_at', 'updated_at'],
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'name_category', 'created_at', 'updated_at'])
  orderBy?: string = 'created_at';

  @ApiPropertyOptional({ 
    description: 'Thứ tự sắp xếp', 
    example: 'DESC', 
    enum: ['ASC', 'DESC'], 
    default: 'DESC' 
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}