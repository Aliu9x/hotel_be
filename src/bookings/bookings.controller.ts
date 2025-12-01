import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  CancelHoldDto,
  CreateBookingDto,
  ReserveBookingDto,
  UpdatePaymentMethodDto,
} from './dto/create-booking.dto';
import { BookingService } from './bookings.service';
import { Public } from 'src/decorator/customize';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingService) {}

  @Post('create')
  @Public()
  async create(@Body() dto: CreateBookingDto) {
    return await this.service.create(dto);
  }

  @Post('reserve')
  @Public()
  async reserve(@Body() dto: ReserveBookingDto) {
    return await this.service.reserve(dto);
  }

  @Post('cancel-hold')
  @Public()
  async cancelHold(@Body() dto: CancelHoldDto) {
    return await this.service.cancelHold(dto);
  }

  @Post('payment-method')
  @Public()
  async paymentMethod(@Body() dto: UpdatePaymentMethodDto) {
    const res = await this.service.updatePaymentMethod(dto);
    return { success: true, data: res };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const b = await this.service.findOne(Number(id));
    return { success: true, data: b };
  }
}
