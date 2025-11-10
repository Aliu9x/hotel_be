import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { HotelModulesService } from './hotel-modules.service';
import { CreateHotelModuleDto } from './dto/create-hotel-module.dto';
import { UpdateHotelModuleDto } from './dto/update-hotel-module.dto';
import { Roles, User } from 'src/decorator/customize';
import { Role } from 'src/interfaces/customize.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('hotel-modules')
@Controller('hotel-modules')
export class HotelModulesController {
  constructor(private readonly service: HotelModulesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateHotelModuleDto, @User() user) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHotelModuleDto,
    @User() user,
  ) {
    return this.service.update(id, dto,user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string,@User() user) {
    return this.service.remove(id,user);
  }
}
