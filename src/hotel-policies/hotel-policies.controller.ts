import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { HotelPoliciesService } from './hotel-policies.service';
import { CreateHotelPolicyDto } from './dto/create-hotel-policy.dto';
import { UpdateHotelPolicyDto } from './dto/update-hotel-policy.dto';
import { Public, Roles, User } from 'src/decorator/customize';
import { Role } from 'src/interfaces/customize.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('hotel-policies')
@Controller('hotel-policies')
export class HotelPoliciesController {
  constructor(private readonly service: HotelPoliciesService) {}

  @Post()
  create(@Body() dto: CreateHotelPolicyDto,@User() user) {
    return this.service.create(dto,user);
  }
@Get('me')
 getProfile(@Req() req) {
  this.service.demo(req.user); // truyền user sang service
  return req.user;
}


  @Get()
  @Public()
  findAll(@User() user, @Query('hotel_id') hotel_id?: string) {
    return this.service.findAll(user, { hotel_id });
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string, @User() user) {
    return this.service.findOne(id,user);
  }

  @Patch(':id')
  @Roles(Role.HOTEL_OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHotelPolicyDto,
    @User() user,
  ) {
    return this.service.update(id, dto, user);
  }
}
