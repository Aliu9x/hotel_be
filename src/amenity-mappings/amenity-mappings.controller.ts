import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AmenityMappingsService } from './amenity-mappings.service';
import { CreateAmenityMappingDto } from './dto/create-amenity-mapping.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';

@Controller('amenity-mappings')
export class AmenityMappingsController {
  constructor(private readonly service: AmenityMappingsService) {}

  @Post()
  @ResponseMessage('Cập nhật tiện ích thành công')
  createOrUpdate(@Body() dto: CreateAmenityMappingDto, @User() user) {
    return this.service.createOrUpdate(dto, user);
  }

  @Get()
  @ResponseMessage('Danh sách tiện ích được chọn')
  getMappings(@Query('room_type_id') room_type_id?: string, @User() user?) {
    return this.service.getMappingsGrouped(user, room_type_id);
  }
}
