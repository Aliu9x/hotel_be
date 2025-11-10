import {
  HotelModule,
  HotelModuleCode,
} from 'src/hotel-modules/entities/hotel-module.entity';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('hotel_module_subscriptions')
@Unique('uq_hotel_module_subscriptions', ['hotel_id'])
@Index('idx_hms_hotel', ['hotel_id'])
@Index('idx_hms_status', ['status'])
export class HotelModuleSubscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({
    type: 'enum',
    enum: HotelModuleCode,
    default: HotelModuleCode.LISTING,
  })
  module_code: HotelModuleCode;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'tinyint', default: () => '0' })
  is_active: boolean;

  @Column({ type: 'datetime', nullable: true })
  started_at?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  suspended_at?: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;

  @ManyToOne(() => Hotel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_id' })
  hotel?: Hotel;
}
