import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { InventoriesModule } from 'src/inventories/inventories.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Payment, Booking]),
    InventoriesModule,
    MailModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
