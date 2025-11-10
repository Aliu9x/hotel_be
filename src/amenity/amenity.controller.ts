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
import { AmenityService } from './amenity.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';
import { ApiTags } from '@nestjs/swagger';
import { ListAmenitiesDto } from './dto/list-amenities.dto';
import { Amenity } from './entities/amenity.entity';
import {  Roles } from 'src/decorator/customize';
import { Role } from 'src/interfaces/customize.interface';

@ApiTags('amenity')
@Roles(Role.ADMIN)
@Controller('amenity')
export class AmenityController {
  constructor(private readonly service: AmenityService) {}

  @Post()
  create(@Body() dto: CreateAmenityDto): Promise<Amenity> {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListAmenitiesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Amenity> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAmenityDto,
  ): Promise<Amenity> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Amenity> {
    return this.service.remove(id);
  }
}
