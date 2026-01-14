import { Controller } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { BookingService } from 'src/bookings/bookings.service';
import { Booking, BookingStatus } from 'src/bookings/entities/booking.entity';
import { LessThan, Repository } from 'typeorm';

@Controller()
export class CronController {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    private readonly bookingService: BookingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredHoldBookings() {
    const now = new Date();
    const expiredBookings = await this.bookingRepo.find({
      where: {
        status: BookingStatus.HOLD,
        hold_expires_at: LessThan(now),
      },
      take: 50,
      order: {
        hold_expires_at: 'ASC',
      },
    });

    for (const booking of expiredBookings) {
      await this.bookingService.cancelExpiredHoldBooking(booking.id);
    }
  }
}
