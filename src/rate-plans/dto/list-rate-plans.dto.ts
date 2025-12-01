import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListRatePlansDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên gói', example: 'Flexible' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Lọc theo room_type_id', example: '15' })
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Trường sắp xếp',
    enum: ['created_at', 'updated_at', 'price_amount', 'name'],
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  orderBy?: 'created_at' | 'updated_at' | 'price_amount' | 'name' = 'created_at';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}