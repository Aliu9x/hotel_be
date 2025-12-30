import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingService } from './bookings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { PaymentModule } from 'src/payment/payment.module';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Inventory, Hotel, RoomType, RatePlan]),
    PaymentModule,
  ],
  controllers: [BookingsController],
  providers: [BookingService],
})
export class BookingsModule {}
