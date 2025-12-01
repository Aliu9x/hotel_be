import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export type BookingStatus = 'DRAFT' | 'HOLD' | 'CANCELLED' | 'EXPIRED' | 'PAID';

@Entity('bookings')
@Index(['hotel_id', 'room_type_id', 'rate_plan_id'])
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  /* Search / room selection context */
  @Column()
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

  @Column({ type: 'int' })
  adults: number;

  @Column({ type: 'int' })
  children: number;

  @Column({ type: 'int' })
  rooms: number;

  /* Pricing snapshot */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price_per_night: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_room_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grand_total: number;

  @Column({ type: 'tinyint', default: 0 })
  prepay_required: number; // 1 nếu rate plan yêu cầu thanh toán trước

  @Column({ length: 50, nullable: true })
  promo_tag?: string;

  /* Contact info */
  @Column({ length: 255 })
  contact_name: string;

  @Column({ length: 255 })
  contact_email: string;

  @Column({ length: 50 })
  contact_phone: string;

  @Column({ type: 'tinyint', default: 1 })
  is_self_book: number;

  /* Guest info (người lưu trú chính) */
  @Column({ length: 255 })
  guest_name: string;

  /* Special requests (JSON string) */
  @Column({ type: 'text', nullable: true })
  special_requests?: string; // JSON: ["nonSmoking","highFloor"]

  /* Hold / reserve */
  @Column({ length: 40, nullable: true })
  reservation_code?: string;

  @Column({ type: 'timestamp', nullable: true })
  hold_expires_at?: Date;

  /* Payment selection */
  @Column({ length: 30, nullable: true })
  payment_method?: string; // VIETQR | PAY_AT_HOTEL | ...

  /* Status */
  @Column({ length: 20 })
  status: BookingStatus; // DRAFT / HOLD / CANCELLED / EXPIRED / PAID

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}