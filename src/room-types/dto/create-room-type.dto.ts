import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  id_category: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  total_rooms?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_adults: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_children?: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bed_config?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  room_size_label?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  floor_level?: string | null;

  @IsOptional()
  @IsBoolean()
  smoking_allowed?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  view?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
