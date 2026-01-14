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

  /**
   * Hủy đặt phòng trong khoảng ngày (cancelBookingRange)
   * POST /inventory/cancel-range
   * Body: { hotelId, roomTypeId, checkInDate, checkOutDate, quantity }
   */
  @Post('cancel-range')
  async cancelBookingRange(@Body() body: {
    hotelId: string;
    roomTypeId: string;
    checkInDate: string; // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD
    quantity: number;
  }) {
    const { hotelId, roomTypeId, checkInDate, checkOutDate, quantity } = body;
    if (!hotelId || !roomTypeId || !checkInDate || !checkOutDate || !quantity) {
      throw new BadRequestException('Thiếu tham số');
    }
    return this.inventoryService.cancelBookingRange(
      hotelId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      quantity,
    );
  }
}
