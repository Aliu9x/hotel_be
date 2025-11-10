import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumberString,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateInventoryDto {
  @IsNumberString()
  hotel_id: string;

  @IsNumberString()
  room_type_id: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  allotment?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sold?: number = 0;

  @IsOptional()
  @IsBoolean()
  stop_sell?: boolean = false;
}