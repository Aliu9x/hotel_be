import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AmenityApplyTo } from '../entities/amenity.entity';

export class CreateAmenityDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string | null;

  @IsOptional()
  @IsEnum(AmenityApplyTo)
  applies_to?: AmenityApplyTo;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
