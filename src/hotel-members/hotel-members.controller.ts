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
import { HotelMembersService } from './hotel-members.service';
import { CreateHotelMemberDto } from './dto/create-hotel-member.dto';
import { UpdateHotelMemberDto } from './dto/update-hotel-member.dto';
import { Roles, User } from 'src/decorator/customize';
import { Role } from 'src/interfaces/customize.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('hotel-members')
@Controller('hotel-members')
export class HotelMembersController {
  constructor(private readonly service: HotelMembersService) {}

  @Post()
  create(@Body() createHotelMemberDto: CreateHotelMemberDto) {
    return this.service.create(createHotelMemberDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HOTEL_OWNER)
  findAll(
    @User() user,
    @Query('hotel_id') hotel_id?: string,
    @Query('user_id') user_id?: string,
  ) {
    return this.service.findAll(user, { hotel_id, user_id });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HOTEL_OWNER)
  findOne(@Param('id') id: string, @User() user) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.HOTEL_OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHotelMemberDto,
    @User() user,
  ) {
    return this.service.update(id, dto, user);
  }

    @Delete(':id')
  @Roles(Role.ADMIN, Role.HOTEL_OWNER)
  remove(@Param('id') id: string,@User() user) {
    return this.service.remove(id,user);
  }
}
