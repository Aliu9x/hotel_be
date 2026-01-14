import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, DataSource } from 'typeorm';
import { Booking, BookingStatus, PaymentType } from './entities/booking.entity';

import {
  CreateBookingDto,
  HoldBookingDto,
  UpdatePaymentTypeDto,
} from './dto/create-booking.dto';
import { PaymentService } from 'src/payment/payment.service';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';
import { InventoriesService } from 'src/inventories/inventories.service';
import { MailService } from 'src/mail/mail.service';
import { bookingConfirmationTemplate } from 'src/mail/booking-confirmation.template';
import { generatePdfFromHtml } from 'src/mail/pdf-generator';
import { bookingPdfTemplate } from 'src/mail/pdf-templates';
import { hotelBookingOwnerNotificationTemplate } from 'src/mail/hotel.booking.owner.notification.template';
import { User } from 'src/users/entities/user.entity';
import { HotelPolicy } from 'src/hotel-policies/entities/hotel-policy.entity';

@Injectable()
export class BookingService {
  constructor(
    private readonly paymentService: PaymentService,

    private readonly dataSource: DataSource,

    private readonly mailService: MailService,

    private readonly inventoriesService: InventoriesService,

    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(HotelPolicy)
    private readonly hotelPolicyRepo: Repository<HotelPolicy>,

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

  private generateReservationCode(): string {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    const random = Math.floor(100000 + Math.random() * 900000);

    return `${y}${m}${d}${random}`;
  }

  async holdBooking(dto: HoldBookingDto, user: IUser) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const nights = this.computeNights(dto.checkin, dto.checkout);
      const holdExpiredAt = new Date(Date.now() + 10 * 60 * 1000);

      const bookingRepo = queryRunner.manager.getRepository(Booking);

      const booking = bookingRepo.create({
        hotel_id: dto.hotelId,
        room_type_id: dto.roomTypeId,
        rate_plan_id: dto.ratePlanId,
        checkin_date: dto.checkin,
        checkout_date: dto.checkout,
        nights,
        user_id: user?.id ? Number(user.id) : null,
        reservation_code: this.generateReservationCode(),
        adults: dto.adults,
        children: dto.children,
        rooms: dto.rooms,
        status: BookingStatus.HOLD,
        hold_expires_at: holdExpiredAt,
        payment_expired_at: null,
      });

      const saved = await bookingRepo.save(booking);

      await this.inventoriesService.holdRoomsRange(
        String(saved.hotel_id),
        String(saved.room_type_id),
        saved.checkin_date,
        saved.checkout_date,
        saved.rooms,
      );

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelExpiredHoldBooking(bookingId: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const bookingRepo = qr.manager.getRepository(Booking);

      const booking = await bookingRepo.findOne({
        where: { id: bookingId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!booking) return;

      if (booking.status !== BookingStatus.HOLD) {
        await qr.rollbackTransaction();
        return;
      }

      booking.status = BookingStatus.CANCELLED;
      booking.cancel_reason = 'HOLD_EXPIRED';
      booking.canceled_at = new Date();

      await bookingRepo.save(booking);

      await this.inventoriesService.releaseHoldRange(
        String(booking.hotel_id),
        String(booking.room_type_id),
        booking.checkin_date,
        booking.checkout_date,
        booking.rooms,
      );
      console.log('xoa thanh cong ');
      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async updateBooking(dto: CreateBookingDto, id: string) {
    const booking = await this.bookingRepo.preload({
      id,
      promo_tag: dto.promoTag,
      contact_name: dto.contactName,
      contact_email: dto.contactEmail,
      contact_phone: dto.contactPhone,
      is_self_book: dto.isSelfBook ?? 1,
      guest_name: dto.guestName,
      total_price: dto.total_price,
    });

    if (!booking) {
      throw new BadRequestException('id booking k hop le');
    }

    return await this.bookingRepo.save(booking);
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
      booking.status = BookingStatus.CONFIRMED;
    }
    this.inventoriesService.confirmBookingRange(
      String(booking.hotel_id),
      String(booking.room_type_id),
      booking.checkin_date,
      booking.checkout_date,
      booking.is_self_book,
    );
    this.sendMails(booking);
    await this.bookingRepo.save(booking);
    return booking;
  }

  async startMomoPayment(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.status !== BookingStatus.HOLD) {
      throw new BadRequestException('Booking is not in HOLD state');
    }

    booking.payment_type = PaymentType.PREPAID;
    booking.status = BookingStatus.PAYMENT_PENDING;
    booking.hold_expires_at = new Date(
      booking.hold_expires_at.getTime() + 10 * 60 * 1000,
    );
    await this.bookingRepo.save(booking);

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
    return b;
  }

  async getMyBookings(user: IUser) {
    const bookings = await this.bookingRepo.find({
      where: {
        user_id: Number(user.id),
        status: In(['CONFIRMED', 'PAID']),
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
    if (filter.from && filter.to) {
      qb.andWhere('b.checkin_date BETWEEN :from AND :to', {
        from: filter.from,
        to: filter.to,
      });
    }
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
    const roomTypeIds = [...new Set(bookings.map((b) => b.room_type_id))];
    const ratePlanIds = [...new Set(bookings.map((b) => b.rate_plan_id))];

    const [roomTypes, ratePlans] = await Promise.all([
      this.roomTypeRepo.findBy({ id: In(roomTypeIds) }),
      this.ratePlanRepo.findBy({ id: In(ratePlanIds) }),
    ]);

    const roomTypeMap = new Map(roomTypes.map((r) => [String(r.id), r]));
    const ratePlanMap = new Map(ratePlans.map((r) => [String(r.id), r]));

    return bookings.map((b) => ({
      ...b,
      roomType: roomTypeMap.get(String(b.room_type_id)) ?? null,
      ratePlan: ratePlanMap.get(String(b.rate_plan_id)) ?? null,
    }));
  }

  async cancelBooking(bookingId: string, user: IUser) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }
    if (
      [BookingStatus.CANCELLED, BookingStatus.EXPIRED].includes(booking.status)
    ) {
      throw new BadRequestException('Booking cannot be cancelled');
    }
    if (user.role === Role.CUSTOMER) {
      if (booking.user_id !== Number(user.id)) {
        throw new ForbiddenException('You can only cancel your own booking');
      }
      booking.cancel_reason = 'CUSTOMER_CANCELLED';
    }
    if (user.role === Role.HOTEL_OWNER) {
      const hotel = await this.hotelRepo.findOne({
        where: {
          id: String(booking.hotel_id),
          created_by_user_id: user.id,
        },
      });
      if (!hotel) {
        throw new ForbiddenException('You do not own this hotel');
      }
      booking.cancel_reason = 'HOTEL_CANCELLED';
    }
    booking.status = BookingStatus.CANCELLED;
    booking.hold_expires_at = null;
    booking.payment_expired_at = null;

    await this.bookingRepo.save(booking);

    await this.inventoriesService.cancelBookingRange(
      String(booking.hotel_id),
      String(booking.room_type_id),
      booking.checkin_date,
      booking.checkout_date,
      booking.rooms,
    );
    console.log({
      success: true,
      bookingId: booking.id,
      cancelReason: booking.cancel_reason,
    });

    return {
      success: true,
      bookingId: booking.id,
      cancelReason: booking.cancel_reason,
    };
  }

  sendMails = async (booking: Booking) => {
    const formatVND = (amount: number) =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    function formatDateVN(date: string | Date): string {
      const d = new Date(date);
      const weekdays = [
        'Chủ Nhật',
        'Thứ Hai',
        'Thứ Ba',
        'Thứ Tư',
        'Thứ Năm',
        'Thứ Sáu',
        'Thứ Bảy',
      ];
      const dayName = weekdays[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      return `${dayName}, ${day}/${month}/${year}`;
    }
    const hotel = await this.hotelRepo.findOne({
      where: { id: String(booking.hotel_id) },
    });

    const roomType = await this.roomTypeRepo.findOne({
      where: { id: String(booking.room_type_id) },
    });

    const hotelPolicy = await this.hotelPolicyRepo.findOne({
      where: { id: String(hotel.id) },
    });

    const bookingData = {
      guestName: booking.guest_name,
      hotelName: hotel.name,
      hotelAddress: [
        hotel.address_line,
        hotel.ward_name,
        hotel.district_name,
        hotel.province_name,
      ]
        .filter(Boolean)
        .join(', '),
      hotelStars: hotel.star_rating,
      hotelImage: 'http://localhost:3000/retrieve',
      hotelDirectionsUrl: 'https://www.google.com/maps',
      checkinNote: hotelPolicy?.default_checkin_time ?? '12:00',
      checkin: formatDateVN(booking.checkin_date),
      checkout: formatDateVN(booking.checkout_date),
      checkoutNote: hotelPolicy?.default_checkout_time ?? '12:00',
      rooms: booking.rooms,
      nights: booking.nights,
      roomType: roomType.name,
      mainGuest: booking.guest_name,
      adults: Number(booking.adults),
      children: Number(booking.children),
      specialRequests: 'chưa thiết lập',
      reservationCode: booking.reservation_code,
      manageBookingUrl: 'http://localhost:3000/retrieve',
      hotelPhone: hotel.contact_phone,
      hotelEmail: hotel.contact_email,
      priceRoom: formatVND(booking.total_price),
      priceTax: 0,
      priceTotal: formatVND(booking.total_price),
      paymentNote: `Thanh toán tại khách sạn ${hotel.name} khi nhận phòng`,
      paymentDetail: `Bạn sẽ thanh toán ${formatVND(booking.total_price)} cho nơi ở vào ngày nhận phòng ngày ${formatDateVN(
        booking.checkin_date,
      )}`,
    };
    const bookingDataPdf = {
      bookingReferenceNo: booking.reservation_code,
      guestName: booking.guest_name,
      countryOfResidence: 'Việt nam',
      hotelName: hotel.name,
      hotelAddress: [
        hotel.address_line,
        hotel.ward_name,
        hotel.district_name,
        hotel.province_name,
      ]
        .filter(Boolean)
        .join(', '),
      hotelPhone: hotel.contact_phone,
      roomCount: booking.rooms,
      extraBeds: 0,
      adults: booking.adults,
      children: booking.children,
      roomType: roomType.name,
      promotion: '0',
      checkIn: formatDateVN(booking.checkin_date),
      checkOut: formatDateVN(booking.checkout_date),
      // paymentMethod: string;
      paymentNote:
        'Thanh toán cho đặt phòng này sẽ được thực hiện tại khách sạn.',
      customerNote: 'string',
      price: formatVND(booking.total_price),
    };
    const hotelOwnerData = {
      hotelName: hotel.name,
      bookingCode: booking.reservation_code,
      guestName: booking.contact_name,
      guestPhone: booking.contact_phone,
      guestEmail: booking.contact_email,
      bookingTime: formatDateVN(booking.created_at),
      checkin: formatDateVN(booking.checkin_date),
      checkout: formatDateVN(booking.checkout_date),
      checkinNote: `sau ${hotelPolicy?.default_checkin_time ?? '12:00'}`,
      checkoutNote: `trước ${hotelPolicy?.default_checkin_time ?? '12:00'}`,
      rooms: booking.rooms,
      nights: booking.nights,
      roomType: roomType.name,
      adults: booking.adults,
      children: booking.children,
      specialRequests: 'chưa',
      totalPrice: formatVND(booking.total_price),
      paymentType: 'Thanh toán tại khách sạn',
    };
    const htmlEmail = bookingConfirmationTemplate(bookingData);
    const pdfHtml = bookingPdfTemplate(bookingDataPdf);
    const pdfBuffer = await generatePdfFromHtml(pdfHtml);

    await this.mailService.sendMail({
      to: booking.contact_email,
      subject: 'Xác nhận đặt phòng của bạn!',
      html: htmlEmail,
      attachments: [
        {
          filename: 'Booking_Confirmation.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await this.mailService.sendMail({
      to: 'truongvanlieu.28022003@gmail.com',
      subject: `[Đơn mới] Đặt phòng tại ${hotel.name} - Mã: ${booking.reservation_code}`,
      html: hotelBookingOwnerNotificationTemplate(hotelOwnerData),
    });
  };
}
