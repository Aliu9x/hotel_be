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
import { HotelModuleSubscriptionsService } from './hotel-module-subscriptions.service';
import { CreateHotelModuleSubscriptionDto } from './dto/create-hotel-module-subscription.dto';
import { UpdateHotelModuleSubscriptionDto } from './dto/update-hotel-module-subscription.dto';
import { Role } from 'src/interfaces/customize.interface';
import { Roles, User } from 'src/decorator/customize';
import { SubscriptionStatus } from './entities/hotel-module-subscription.entity';
import { HotelModuleCode } from 'src/hotel-modules/entities/hotel-module.entity';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('hotel-module-subscriptions')
@Controller('hotel-module-subscriptions')
export class HotelModuleSubscriptionsController {
  constructor(private readonly service: HotelModuleSubscriptionsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @User() user,
    @Query('hotel_id') hotel_id?: string,
    @Query('module_code') module_code?: HotelModuleCode,
    @Query('status') status?: SubscriptionStatus,
  ) {
    return this.service.findAll(user, { hotel_id, module_code, status });
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string, @User() user) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHotelModuleSubscriptionDto,
    @User() user,
  ) {
    return this.service.update(id, dto, user);
  }
}
