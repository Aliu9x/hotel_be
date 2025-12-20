import { Booking } from 'src/bookings/entities/booking.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
export enum PaymentStatus {
  PENDING = 'PENDING', // Mới tạo, chờ thanh toán
  PROCESSING = 'PROCESSING', // Đang xử lý (optional)
  SUCCESS = 'SUCCESS', // Thanh toán thành công
  FAILED = 'FAILED', // Thanh toán thất bại
  CANCELLED = 'CANCELLED', // Người dùng hủy
  EXPIRED = 'EXPIRED', // Quá hạn/không thanh toán
}
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  orderId: string;

  @Column({ type: 'bigint' })
  amount: number; 

  @Column({ type: 'varchar', length: 255 })
  orderInfo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transId?: string; 

  @Column({ type: 'varchar', length: 255, nullable: true })
  message?: string;

  @Column({ type: 'varchar', length: 32, default: PaymentStatus.PENDING })
  status: PaymentStatus;
  
  @ManyToOne(() => Booking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Index()
  @Column({ type: 'bigint' })
  booking_id: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
