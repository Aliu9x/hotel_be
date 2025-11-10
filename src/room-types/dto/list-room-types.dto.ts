import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListRoomTypesDto {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo tên loại phòng', example: 'Deluxe' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Hướng nhìn (City, Garden, Sea, Pool...)', example: 'Sea' })
  @IsOptional()
  @IsString()
  view?: string;

  @ApiPropertyOptional({ description: 'Cấu hình giường (VD: 1Q, 2T, 1K...)', example: '1Q' })
  @IsOptional()
  @IsString()
  bed_config?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Sức chứa tối đa (lọc các phòng có sức chứa >= giá trị này)', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_occupancy?: number;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu lọc theo thời gian tạo (YYYY-MM-DD)', example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc lọc theo thời gian tạo (YYYY-MM-DD)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Trang hiện tại', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số lượng bản ghi mỗi trang', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Trường dùng để sắp xếp',
    example: 'created_at',
    enum: ['id', 'name', 'created_at', 'max_occupancy'],
    default: 'created_at',
  })
  @IsOptional()
  @IsIn(['id', 'name', 'created_at', 'max_occupancy'])
  orderBy?: string = 'created_at';

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', example: 'DESC', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}