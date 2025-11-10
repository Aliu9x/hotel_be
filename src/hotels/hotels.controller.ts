import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Roles, User } from 'src/decorator/customize';
import { Role } from 'src/interfaces/customize.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('hotels')
@Controller('hotels')
@Roles()
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HOTEL_OWNER)
  create(@Body() dto: CreateHotelDto, @User() user) {
    return this.hotelsService.create(dto, user);
  }

  @Get()
  findAll(@User() user) {
    return this.hotelsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user) {
    return this.hotelsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.HOTEL_OWNER)
  update(@Param('id') id: string, @Body() dto: UpdateHotelDto, @User() user) {
    return this.hotelsService.update(id, dto, user);
  }
}
