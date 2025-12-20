import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';

import { Inventory } from 'src/inventories/entities/inventory.entity';
import {
  CreateBookingDto,
} from './dto/create-booking.dto';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class BookingService {
  private HOLD_MINUTES = 5;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly paymentService: PaymentService,
  ) {}

  private computeNights(checkin: string, checkout: string) {
    const n = Math.ceil(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (n <= 0) throw new BadRequestException('Checkout must be after checkin');
    return n;
  }

  async cleanupExpired() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const candidates = await this.bookingRepo.find({
      where: [
        { status: 'HOLD' as BookingStatus, updated_at: LessThan(twoHoursAgo) },
      ],
    });
    for (const b of candidates) {
      b.status = 'EXPIRED';
      await this.bookingRepo.save(b);
    }
  }
  async create(dto: CreateBookingDto) {
    await this.cleanupExpired();

    const nights = this.computeNights(dto.checkin, dto.checkout);

    const totalRoomPrice = dto.pricePerNight * nights * dto.rooms;
    const taxAmount = Math.round(totalRoomPrice * 0.15);
    const grandTotal = totalRoomPrice + taxAmount;

    const booking = this.bookingRepo.create({
      hotel_id: dto.hotelId,
      room_type_id: dto.roomTypeId,
      rate_plan_id: dto.ratePlanId,
      checkin_date: dto.checkin,
      checkout_date: dto.checkout,
      nights,
      adults: dto.adults,
      children: dto.children,
      rooms: dto.rooms,
      price_per_night: dto.pricePerNight,
      total_room_price: totalRoomPrice,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      prepay_required: dto.prepayRequired,
      promo_tag: dto.promoTag,
      contact_name: dto.contactName,
      contact_email: dto.contactEmail,
      contact_phone: dto.contactPhone,
      is_self_book: dto.isSelfBook ?? 1,
      guest_name: dto.guestName,
      special_requests: dto.specialRequests
        ? JSON.stringify(dto.specialRequests)
        : undefined,
      status: 'HOLD',
    });
    const saved = await this.bookingRepo.save(booking);
    return saved;
  }
  async startMomoPayment(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new BadRequestException('Booking not found');

    const amount = String(Math.round(Number(booking.grand_total)));
    const orderInfo = `Booking ${booking.id} at hotel ${booking.hotel_id}`;

    const resp = await this.paymentService.createPayment({
      amount,
      orderInfo,
      bookingId: booking.id,
    });

    return {
      bookingId: booking.id,
      payUrl: resp.payUrl,
      orderId: resp.orderId,
      requestId: resp.requestId,
    };
  }

  async getStatus(bookingId: string) {
    const b = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!b) throw new BadRequestException('Booking not found');
    return {
      bookingId: b.id,
      status: b.status,
      amount: b.grand_total,
      updatedAt: b.updated_at,
    };
  }
}
