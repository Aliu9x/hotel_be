import { IsDateString, IsOptional, IsString, MaxLength, IsNumberString } from 'class-validator';

export class CreateTemporaryLockDto {
  @IsNumberString()
  hotel_id: string;

  @IsOptional()
  @IsNumberString()
  room_type_id?: string | null;

  @IsDateString()
  start_date: string; // YYYY-MM-DD

  @IsDateString()
  end_date: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string | null;
}