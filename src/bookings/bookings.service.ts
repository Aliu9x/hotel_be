import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Booking, BookingStatus, PaymentType } from './entities/booking.entity';

import { Inventory } from 'src/inventories/entities/inventory.entity';
import {
  CreateBookingDto,
  UpdatePaymentTypeDto,
} from './dto/create-booking.dto';
import { PaymentService } from 'src/payment/payment.service';
import { IUser } from 'src/interfaces/customize.interface';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';

@Injectable()
export class BookingService {
  private HOLD_MINUTES = 5;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly paymentService: PaymentService,

    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,

    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,

    @InjectRepository(RatePlan)
    private readonly ratePlanRepo: Repository<RatePlan>,
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
  private generateReservationCode(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    const random = Math.floor(100000 + Math.random() * 900000);

    return `${y}${m}${d}${random}`;
  }

  async create(dto: CreateBookingDto, user: IUser) {
    const nights = this.computeNights(dto.checkin, dto.checkout);

    const expiredAt = new Date(Date.now() + 10 * 60 * 1000);
    let userId: number | null = null;

    if (user && user.id) {
      userId = Number(user.id);
    }
    const booking = this.bookingRepo.create({
      hotel_id: dto.hotelId,
      room_type_id: dto.roomTypeId,
      rate_plan_id: dto.ratePlanId,
      checkin_date: dto.checkin,
      checkout_date: dto.checkout,
      nights,
      user_id: userId,
      reservation_code: this.generateReservationCode(),
      adults: dto.adults,
      children: dto.children,
      rooms: dto.rooms,
      total_price: dto.total_price,
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
      payment_expired_at: expiredAt,
    });
    const saved = await this.bookingRepo.save(booking);
    return saved;
  }
  async updatePaymentType(dto: UpdatePaymentTypeDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
    });
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }
    if (booking.status !== 'HOLD') {
      throw new BadRequestException(
        'Không thể thay đổi phương thức thanh toán',
      );
    }
    if (dto.paymentType === PaymentType.PAY_AT_HOTEL) {
      booking.payment_type = PaymentType.PAY_AT_HOTEL;
      booking.status = 'CONFIRMED';
    }

    if (dto.paymentType === PaymentType.PREPAID) {
      booking.payment_type = PaymentType.PREPAID;
    }

    return await this.bookingRepo.save(booking);
  }

  async startMomoPayment(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new BadRequestException('Booking not found');

    const amount = String(Math.round(Number(booking.total_price)));
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
      amount: b.total_price,
      updatedAt: b.updated_at,
    };
  }
  async getMyBookings(user: IUser) {
    const bookings = await this.bookingRepo.find({
      where: {
        user_id: Number(user.id),
        status: In(['PAID', 'CONFIRMED']),
      },
      order: {
        created_at: 'DESC',
      },
    });

    if (!bookings.length) return [];
    const hotelIds = [...new Set(bookings.map((b) => b.hotel_id))];
    const roomTypeIds = [...new Set(bookings.map((b) => b.room_type_id))];
    const ratePlanIds = [...new Set(bookings.map((b) => b.rate_plan_id))];
    const [hotels, roomTypes, ratePlans] = await Promise.all([
      this.hotelRepo.findBy({ id: In(hotelIds) }),
      this.roomTypeRepo.findBy({ id: In(roomTypeIds) }),
      this.ratePlanRepo.findBy({ id: In(ratePlanIds) }),
    ]);
    const hotelMap = new Map(hotels.map((h) => [h.id, h]));
    const roomTypeMap = new Map(roomTypes.map((r) => [r.id, r]));
    const ratePlanMap = new Map(ratePlans.map((r) => [r.id, r]));
    return bookings.map((b) => ({
      ...b,
      hotel: hotelMap.get(String(b.hotel_id)) ?? null,
      roomType: roomTypeMap.get(String(b.room_type_id)) ?? null,
      ratePlan: ratePlanMap.get(String(b.rate_plan_id)) ?? null,
    }));
  }
async getOwnerBookings(
  user: IUser,
  filter: {
    from?: string;
    to?: string;
    keyword?: string;
  },
) {
  const qb = this.bookingRepo.createQueryBuilder('b');

  qb.where('b.hotel_id = :hotelId', {
    hotelId: Number(user.hotel_id),
  });

  qb.andWhere('b.status IN (:...statuses)', {
    statuses: ['PAID', 'CONFIRMED', 'CANCELLED'],
  });

  // 🔎 Tìm theo khoảng ngày (checkin)
  if (filter.from && filter.to) {
    qb.andWhere(
      'b.checkin_date BETWEEN :from AND :to',
      {
        from: filter.from,
        to: filter.to,
      },
    );
  }

  // 🔎 Tìm theo mã booking hoặc tên khách
  if (filter.keyword) {
    qb.andWhere(
      `(
        b.reservation_code LIKE :kw
        OR b.guest_name LIKE :kw
        OR b.contact_name LIKE :kw
      )`,
      {
        kw: `%${filter.keyword}%`,
      },
    );
  }

  qb.orderBy('b.created_at', 'DESC');

  const bookings = await qb.getMany();
  if (!bookings.length) return [];

  // ===== LẤY DATA PHỤ =====
  const roomTypeIds = [...new Set(bookings.map(b => b.room_type_id))];
  const ratePlanIds = [...new Set(bookings.map(b => b.rate_plan_id))];

  const [roomTypes, ratePlans] = await Promise.all([
    this.roomTypeRepo.findBy({ id: In(roomTypeIds) }),
    this.ratePlanRepo.findBy({ id: In(ratePlanIds) }),
  ]);

  const roomTypeMap = new Map(roomTypes.map(r => [String(r.id), r]));
  const ratePlanMap = new Map(ratePlans.map(r => [String(r.id), r]));

  return bookings.map(b => ({
    ...b,
    roomType: roomTypeMap.get(String(b.room_type_id)) ?? null,
    ratePlan: ratePlanMap.get(String(b.rate_plan_id)) ?? null,
  }));
}


  // bookings.service.ts
  async cancelBooking(bookingId: string, user: IUser) {
    const booking = await this.bookingRepo.findOne({
      where: {
        id: bookingId,
        user_id: Number(user.id),
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (['CANCELLED', 'EXPIRED'].includes(booking.status)) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    booking.status = 'CANCELLED';
    booking.hold_expires_at = null;
    booking.payment_expired_at = null;

    // nếu bạn muốn lưu lý do → cần thêm column
    // booking.cancel_reason = dto.reason ?? null;

    return this.bookingRepo.save(booking);
  }
}
