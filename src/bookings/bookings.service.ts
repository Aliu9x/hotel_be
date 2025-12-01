import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking } from './entities/booking.entity';

import { v4 as uuid } from 'uuid';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { CancelHoldDto, CreateBookingDto, ReserveBookingDto, UpdatePaymentMethodDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  private HOLD_MINUTES = 5;

  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Inventory) private readonly invRepo: Repository<Inventory>
  ) {}

  private computeNights(ci: string, co: string) {
    const c1 = new Date(ci);
    const c2 = new Date(co);
    const diff = c2.getTime() - c1.getTime();
    if (diff <= 0) throw new BadRequestException('checkout phải sau checkin');
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  async cleanupExpired() {
    const now = new Date();
    const list = await this.bookingRepo.find({
      where: { hold_expires_at: LessThan(now), status: 'HOLD' }
    });
    for (const b of list) {
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
      special_requests: dto.specialRequests ? JSON.stringify(dto.specialRequests) : undefined,
      status: 'DRAFT'
    });
    const saved = await this.bookingRepo.save(booking);
    return saved;
  }

  async reserve(dto: ReserveBookingDto) {
    await this.cleanupExpired();

    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking không tồn tại');
    if (booking.status !== 'DRAFT') {
      throw new BadRequestException('Booking không ở trạng thái DRAFT');
    }

    // Kiểm tra tồn kho trước khi hold
    const invRows = await this.invRepo.createQueryBuilder('inv')
      .select(['inv.inventory_date', 'inv.available_rooms', 'inv.blocked_rooms', 'inv.rooms_sold', 'inv.stop_sell'])
      .where('inv.room_type_id = :rt', { rt: booking.room_type_id })
      .andWhere('inv.inventory_date >= :ci', { ci: booking.checkin_date })
      .andWhere('inv.inventory_date < :co', { co: booking.checkout_date })
      .getMany();

    if (invRows.length !== booking.nights) {
      throw new BadRequestException('Thiếu dữ liệu tồn kho cho toàn bộ kỳ nghỉ');
    }

    for (const r of invRows) {
      // @ts-ignore dynamic fields
      if (r.stop_sell === 1) throw new BadRequestException('Có ngày stop sell');
      // @ts-ignore
      const effective = r.available_rooms - r.blocked_rooms - r.rooms_sold;
      if (effective < booking.rooms) {
        throw new BadRequestException('Không đủ phòng để giữ');
      }
    }

    const expires = new Date(Date.now() + this.HOLD_MINUTES * 60000);
    const reservationCode = uuid().replace(/-/g, '').slice(0, 16);

    booking.reservation_code = reservationCode;
    booking.hold_expires_at = expires;
    booking.status = 'HOLD';
    await this.bookingRepo.save(booking);

    return {
      reservationCode,
      expiresAt: expires.toISOString(),
    };
  }

  async cancelHold(dto: CancelHoldDto) {
    await this.cleanupExpired();
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking không tồn tại');
    if (booking.status !== 'HOLD') {
      throw new BadRequestException('Booking không ở trạng thái HOLD');
    }
    booking.status = 'CANCELLED';
    await this.bookingRepo.save(booking);
    return { cancelled: true };
  }

  async updatePaymentMethod(dto: UpdatePaymentMethodDto) {
    const booking = await this.bookingRepo.findOne({ where: { id: dto.bookingId } });
    if (!booking) throw new NotFoundException('Booking không tồn tại');
    if (booking.status !== 'HOLD') {
      throw new BadRequestException('Booking phải ở trạng thái HOLD để chọn payment');
    }

    const onlineOnly = booking.prepay_required === 1;
    if (onlineOnly && dto.paymentMethod !== 'VIETQR') {
      throw new BadRequestException('Rate plan yêu cầu thanh toán trước - chỉ VietQR / Online.');
    }
    booking.payment_method = dto.paymentMethod;
    await this.bookingRepo.save(booking);
    return { bookingId: booking.id, paymentMethod: booking.payment_method };
  }

  async findOne(id: number) {
    return this.bookingRepo.findOne({ where: { id } });
  }
}