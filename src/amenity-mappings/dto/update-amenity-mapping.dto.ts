import { PartialType } from '@nestjs/swagger';
import { CreateAmenityMappingDto } from './create-amenity-mapping.dto';

export class UpdateAmenityMappingDto extends PartialType(CreateAmenityMappingDto) {}
