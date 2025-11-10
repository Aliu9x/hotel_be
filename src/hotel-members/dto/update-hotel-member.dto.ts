import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelMemberDto } from './create-hotel-member.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateHotelMemberDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}