import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';

export type BookingStatus ='HOLD' | 'CANCELLED' | 'EXPIRED' | 'PAID';

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

  @Column({ type: 'int' })
  adults: number;

  @Column({ type: 'int' })
  children: number;

  @Column({ type: 'int' })
  rooms: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price_per_night: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_room_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  grand_total: number;

  @Column({ type: 'tinyint', default: 0 })
  prepay_required: number;

  
  @Column({ length: 50, nullable: true })
  promo_tag?: string;

  @Column({ length: 255 })
  contact_name: string;

  @Column({ length: 255 })
  contact_email: string;

  @Column({ length: 50 })
  contact_phone: string;

  @Column({ type: 'tinyint', default: 1 })
  is_self_book: number;

  @Column({ length: 255 })
  guest_name: string;

  @Column({ type: 'text', nullable: true })
  special_requests?: string;

  
  @Column({ length: 40, nullable: true })
  reservation_code?: string;

  @Column({ type: 'timestamp', nullable: true })
  hold_expires_at?: Date;

  @Column({ length: 30, nullable: true })
  payment_method?: string; 

  @Column({ length: 20 })
  status: BookingStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}