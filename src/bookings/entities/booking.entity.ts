import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum BookingStatus {
  HOLD = 'HOLD',
  CANCELLED = 'CANCELLED',
  CONFIRMED = 'CONFIRMED', 
  EXPIRED = 'EXPIRED',
  PAID = 'PAID',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
}

export enum PaymentType {
  PREPAID = 'PREPAID',
  PAY_AT_HOTEL = 'PAY_AT_HOTEL',
}
@Entity('bookings')
@Index(['hotel_id', 'room_type_id', 'rate_plan_id'])
export class Booking {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: number;

  @Column()
  room_type_id: number;

  @Column()
  rate_plan_id: number;

  @Column({ type: 'date' })
  checkin_date: string;

  @Column({ type: 'date' })
  checkout_date: string;

  @Column({ type: 'int' })
  nights: number;

  @Column({ type: 'int', default: null })
  user_id: number;

  @Column({ type: 'int' })
  adults: number;

  @Column({ type: 'int' })
  children: number;

  @Column({ type: 'int' })
  rooms: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_price: number;

  @Column({
    type: 'enum',
    enum: PaymentType,
    nullable: true,
  })
  payment_type?: PaymentType;

  @Column({ length: 50, nullable: true })
  promo_tag?: string;

  @Column({ length: 255, nullable: true })
  contact_name: string;

  @Column({ length: 255, nullable: true })
  contact_email: string;

  @Column({ length: 50, nullable: true })
  contact_phone: string;

  @Column({ type: 'tinyint', default: 1 })
  is_self_book: number;

  @Column({ length: 255, nullable: true })
  guest_name: string;

  @Column({ type: 'text', nullable: true })
  special_requests?: string;

  @Column({ type: 'text', nullable: true })
  cancel_reason?: string;
  @Column({ type: 'timestamp', nullable: true })
  hold_expires_at?: Date;

  @Column({ length: 40, nullable: true })
  reservation_code?: string;

  @Column({ type: 'timestamp', nullable: true })
  canceled_at?: Date;

  @Column({ type: 'datetime', nullable: true })
  payment_expired_at?: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.HOLD,
  })
  status: BookingStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
