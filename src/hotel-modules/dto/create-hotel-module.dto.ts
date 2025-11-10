import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { HotelModuleCode } from '../entities/hotel-module.entity';
import { Type } from 'class-transformer';

export class CreateHotelModuleDto {
  @IsOptional()
  @IsEnum(HotelModuleCode)
  @Type(() => String)
  code?: HotelModuleCode = HotelModuleCode.LISTING;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}
