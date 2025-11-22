import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AmenityApplyTo } from '../entities/amenity-category.entity';

class AmenityItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateAmenityCategoryDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(AmenityApplyTo)
  applies_to: AmenityApplyTo;

  @IsOptional()
  is_active?: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AmenityItemDto)
  amenities: AmenityItemDto[];
}
