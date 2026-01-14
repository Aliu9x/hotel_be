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
import { InventoriesModule } from 'src/inventories/inventories.module';
import { MailModule } from 'src/mail/mail.module';
import { User } from 'src/users/entities/user.entity';
import { HotelPolicy } from 'src/hotel-policies/entities/hotel-policy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      Inventory,
      Hotel,
      RoomType,
      RatePlan,
      User,
      HotelPolicy,
    ]),
    PaymentModule,
    InventoriesModule,
    MailModule,
  ],
  controllers: [BookingsController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingsModule {}
