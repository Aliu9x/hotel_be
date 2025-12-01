import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';

export enum MealPlanType {
  NONE = 'NONE',
  BREAKFAST = 'BREAKFAST',
  HALF_BOARD = 'HALF_BOARD',
  FULL_BOARD = 'FULL_BOARD',
}

export enum RatePlanType {
  REFUNDABLE = 'REFUNDABLE',
  NON_REFUNDABLE = 'NON_REFUNDABLE',
  SEMI_FLEX = 'SEMI_FLEX',
}

@Entity('rate_plans')
@Index('idx_rate_plans_hotel_room_type', ['hotel_id', 'room_type_id'])
export class RatePlan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'hotel_id' })
  hotel_id: string;

  @Column({ type: 'bigint', name: 'room_type_id' })
  room_type_id: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'price_amount' })
  price_amount: string; 

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: MealPlanType,
    name: 'meal_plan',
    nullable: true,
  })
  meal_plan?: MealPlanType;

  @Column({
    type: 'enum',
    enum: RatePlanType,
    name: 'type',
  })
  type: RatePlanType;

  @Column({ type: 'int', name: 'base_occupancy', default: 2 })
  base_occupancy: number;

  @Column({ type: 'int', name: 'max_occupancy' })
  max_occupancy: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'extra_adult_fee',
    default: 0,
  })
  extra_adult_fee: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'extra_child_fee',
    default: 0,
  })
  extra_child_fee: string;

  @Column({
    type: 'boolean',
    name: 'prepayment_required',
    default: false,
  })
  prepayment_required: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;

  @ManyToOne(() => Hotel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @ManyToOne(() => RoomType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType;
}
