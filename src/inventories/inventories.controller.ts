import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { InventoriesService } from './inventories.service';

import { User } from 'src/decorator/customize';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoryService: InventoriesService) {}

  @Get()
  async getInventories(
    @User() user,
    @Query('roomTypeId') roomTypeId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.inventoryService.getByRoomType(
      user,
      roomTypeId,
      fromDate,
      toDate,
    );
  }
}
