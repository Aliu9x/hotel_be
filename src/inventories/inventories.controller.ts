import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException, Put } from '@nestjs/common';
import { InventoriesService } from './inventories.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { ReserveInventoryDto } from './dto/reserve-inventory.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { InventoryException } from './inventory-errors';

@Controller('inventories')
export class InventoriesController {
  constructor(private readonly service: InventoriesService) {}

  @Post()
  async create(@Body() dto: CreateInventoryDto) {
    try {
      const inv = await this.service.create(dto);
      return { success: true, data: inv };
    } catch (e) {
      this.handleError(e);
    }
  }

  @Get()
  async range(
    @Query('hotelId') hotelId: string,
    @Query('roomTypeId') roomTypeId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    if (!hotelId || !roomTypeId || !fromDate || !toDate) {
      throw new BadRequestException('Missing query params');
    }
    try {
      const data = await this.service.findRange(
        Number(hotelId),
        Number(roomTypeId),
        fromDate,
        toDate,
      );
      return { success: true, data };
    } catch (e) {
      this.handleError(e);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    try {
      const inv = await this.service.update(id, dto);
      return { success: true, data: inv };
    } catch (e) {
      this.handleError(e);
    }
  }

  @Patch(':id/adjust')
  async adjust(@Param('id') id: string, @Body() dto: AdjustInventoryDto) {
    try {
      const inv = await this.service.adjust(id, dto);
      return { success: true, data: inv };
    } catch (e) {
      this.handleError(e);
    }
  }

  @Post('reserve')
  async reserve(@Body() dto: ReserveInventoryDto) {
    try {
      const result = await this.service.reserve(dto);
      return { success: true, data: result };
    } catch (e) {
      this.handleError(e);
    }
  }

  @Post('cancel')
  async cancel(@Body() dto: CancelReservationDto) {
    try {
      const result = await this.service.cancel(dto);
      return { success: true, data: result };
    } catch (e) {
      this.handleError(e);
    }
  }

  private handleError(e: any): never {
    if (e instanceof InventoryException) {
      throw new BadRequestException({
        success: false,
        errorCode: e.code,
        message: e.message,
        context: e.context,
      });
    }
    throw new BadRequestException({
      success: false,
      errorCode: 'UNKNOWN',
      message: e.message || 'Unknown error',
    });
  }
}