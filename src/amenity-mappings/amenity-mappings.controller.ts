import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AmenityMappingsService } from './amenity-mappings.service';
import { CreateAmenityMappingDto } from './dto/create-amenity-mapping.dto';
import { UpdateAmenityMappingDto } from './dto/update-amenity-mapping.dto';
import { User } from 'src/decorator/customize';
import { AmenityEntityType } from './entities/amenity-mapping.entity';

@Controller('amenity-mappings')
export class AmenityMappingsController {
  constructor(
    private readonly amenityMappingsService: AmenityMappingsService,
  ) {}

  @Post()
  create(
    @Body() createAmenityMappingDto: CreateAmenityMappingDto,
    @User() user,
  ) {
    return this.amenityMappingsService.create(createAmenityMappingDto, user);
  }

  @Get()
  async findAvailableAmenities(
    @Query('hotel_id') hotel_id: string,
    @Query('entity_type') entity_type: AmenityEntityType,
    @Query('entity_id') entity_id?: string,
  ) {
    return this.amenityMappingsService.findAvailableAmenities({
      hotel_id,
      entity_type,
      entity_id,
    });
  }
  @Post('update-delete')
  remove(
    @Body() createAmenityMappingDto: CreateAmenityMappingDto,
    @User() user,
  ) {
    return this.amenityMappingsService.updateAmenities(
      createAmenityMappingDto,
      user,
    );
  }
}
