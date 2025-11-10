import { Type } from 'class-transformer';
import {
  IsOptional,
  IsNumberString,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsIn,
  IsDateString,
} from 'class-validator';

export class ListInventoriesDto {
  @IsOptional()
  @IsNumberString()
  hotel_id?: string;

  @IsOptional()
  @IsNumberString()
  room_type_id?: string;

  // exact date filter
  @IsOptional()
  @IsDateString()
  date?: string;

  // date range
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsBoolean()
  stop_sell?: boolean;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 50;

  @IsOptional()
  @IsIn(['id', 'hotel_id', 'room_type_id', 'date', 'allotment', 'sold', 'stop_sell', 'updated_at'])
  orderBy?:
    | 'id'
    | 'hotel_id'
    | 'room_type_id'
    | 'date'
    | 'allotment'
    | 'sold'
    | 'stop_sell'
    | 'updated_at' = 'date';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}