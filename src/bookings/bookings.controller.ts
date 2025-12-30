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
import {
  CancelHoldDto,
  CreateBookingDto,
  ReserveBookingDto,
  UpdatePaymentMethodDto,
  UpdatePaymentTypeDto,
} from './dto/create-booking.dto';
import { BookingService } from './bookings.service';
import { Public, User } from 'src/decorator/customize';
import { PaymentType } from './entities/booking.entity';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingService) {}

  @Post()
  async create(@Body() dto: CreateBookingDto, @User() user) {
    return this.service.create(dto, user);
  }

  @Post(':id/pay/momo')
  @Public()
  async startMomo(@Param('id') id: string) {
    return this.service.startMomoPayment(id);
  }

  @Post('payment-type')
  @Public()
  async updatePaymentType(@Body() dto: UpdatePaymentTypeDto) {
    return this.service.updatePaymentType(dto);
  }

  @Get('my-bookings')
  async myBookings(@User() user) {
    return this.service.getMyBookings(user);
  }

@Get('owner-bookings')
async ownerBookings(
  @User() user,
  @Query('from') from?: string,
  @Query('to') to?: string,
  @Query('keyword') keyword?: string,
) {
  return this.service.getOwnerBookings(user, {
    from,
    to,
    keyword,
  });
}

  
  @Patch(':id/cancel')
  async cancelBooking(@Param('id') id: string, @User() user) {
    return this.service.cancelBooking(id, user);
  }

  @Get(':id')
  @Public()
  async status(@Param('id') id: string) {
    return this.service.getStatus(id);
  }
}
