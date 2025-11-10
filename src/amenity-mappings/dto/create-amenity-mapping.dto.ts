import { IsEnum, IsOptional, IsString, MaxLength, IsNumberString } from 'class-validator';

export class CreateAmenityMappingDto {

  @IsNumberString()
  entity_id: string;

  @IsNumberString()
  amenity_ids: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  value?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string | null;
}