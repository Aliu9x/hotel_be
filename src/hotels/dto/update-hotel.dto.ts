import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelDto } from './create-hotel.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHotelDto extends PartialType(CreateHotelDto) {
  code?: never;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
