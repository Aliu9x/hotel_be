import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAmenityMappingDto {


  @IsOptional()
  @IsString()
  room_type_id?: string;

  @IsArray()
  @IsNotEmpty()
  amenity_ids: string[];
}
