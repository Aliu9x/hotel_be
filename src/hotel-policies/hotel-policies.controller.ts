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
import { ApiTags } from '@nestjs/swagger';
import { IUser } from 'src/interfaces/customize.interface';

@ApiTags('hotel-policies')
@Controller('hotel-policies')
export class HotelPoliciesController {
  constructor(private readonly service: HotelPoliciesService) {}

  @Post()
  create(@Body() dto: CreateHotelPolicyDto, @User() user) {
    return this.service.createOrUpdate(dto, user);
  }

  @Get()
  findOne(@User() user: IUser, @Query('hotelId') hotelId?: string) {
    return this.service.findOne(user, hotelId);
  }
}
