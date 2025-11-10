import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsNumberString,
  Min,
} from 'class-validator';

export class CreatePriceDto {
  @IsNumberString()
  hotel_id: string;

  @IsNumberString()
  room_type_id: string;

  @IsNumberString()
  rate_plan_id: string;

  @IsDateString()
  date: string; // YYYY-MM-DD

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price_amount: number;
}