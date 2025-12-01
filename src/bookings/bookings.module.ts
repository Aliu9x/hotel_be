import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingService } from './bookings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Inventory])],
  controllers: [BookingsController],
  providers: [BookingService],
})
export class BookingsModule {}
