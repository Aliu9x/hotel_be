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

  @Post()
  @Public()
  async create(@Body() dto: CreateBookingDto) {
    return this.service.create(dto);
  }

  @Post(':id/pay/momo')
  @Public()
  async startMomo(@Param('id') id: string) {
    return this.service.startMomoPayment(id);
  }

  @Get(':id')
  @Public()
  async status(@Param('id') id: string) {
    return this.service.getStatus(id);
  }
}
