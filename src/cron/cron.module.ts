import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/bookings/entities/booking.entity';
import { InventoriesModule } from 'src/inventories/inventories.module';
import { BookingService } from 'src/bookings/bookings.service';
import { BookingsModule } from 'src/bookings/bookings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), BookingsModule],
  controllers: [CronController],
})
export class CronModule {}
