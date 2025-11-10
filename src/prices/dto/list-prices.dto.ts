import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListPricesDto {
  @IsOptional()
  @IsNumberString()
  hotel_id?: string;

  @IsOptional()
  @IsNumberString()
  room_type_id?: string;

  @IsOptional()
  @IsNumberString()
  rate_plan_id?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;

  // search by rate plan name (JOIN)
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
  limit?: number = 100;

  @IsOptional()
  @IsIn([
    'id',
    'hotel_id',
    'room_type_id',
    'rate_plan_id',
    'date',
    'price_amount',
    'updated_at',
  ])
  orderBy?:
    | 'id'
    | 'hotel_id'
    | 'room_type_id'
    | 'rate_plan_id'
    | 'date'
    | 'price_amount'
    | 'updated_at' = 'date';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}