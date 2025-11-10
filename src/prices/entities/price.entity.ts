import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'prices' })
@Index('idx_prices_hotel_room_rate_date', [
  'hotel_id',
  'room_type_id',
  'rate_plan_id',
  'date',
])
@Unique('uq_prices_rateplan_date', ['rate_plan_id', 'date'])
export class Price {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'bigint' })
  room_type_id: string;

  @Column({ type: 'bigint', name: 'rate_plan_id' })
  rate_plan_id: string;

  @ManyToOne(() => RatePlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rate_plan_id' })
  rate_plan?: RatePlan;

  @ManyToOne(() => RoomType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_type_id' })
  room_type?: RoomType;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD local hotel date

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'price_amount',
  })
  price_amount: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;
}
