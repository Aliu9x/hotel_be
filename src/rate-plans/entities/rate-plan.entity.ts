import { CancellationPolicy } from 'src/cancellation-policies/entities/cancellation-policy.entity';
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

@Entity({ name: 'rate_plans' })
@Index('idx_rate_plans_hotel_room_active', ['hotel_id', 'room_type_id', 'is_active'])
export class RatePlan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'bigint' })
  room_type_id: string;

  @ManyToOne(() => RoomType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_type_id' })
  room_type?: RoomType;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({
    type: 'enum',
    enum: MealPlanType,
    enumName: 'meal_plan_type',
    nullable: true,
  })
  meal_plan?: MealPlanType | null;

  @Column({
    type: 'enum',
    enum: RatePlanType,
    enumName: 'rate_plan_type',
    name: 'type',
  })
  type: RatePlanType;

  @Column({ type: 'int', name: 'base_occupancy', default: () => '2' })
  base_occupancy: number;

  @Column({ type: 'int', name: 'max_occupancy' })
  max_occupancy: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'extra_adult_fee',
    default: () => '0.00',
  })
  extra_adult_fee: string; // store as string for precision

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'extra_child_fee',
    default: () => '0.00',
  })
  extra_child_fee: string; // store as string for precision

  @Column({ type: 'bigint', nullable: true, name: 'cancellation_policy_id' })
  cancellation_policy_id?: string | null;

  @ManyToOne(() => CancellationPolicy, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cancellation_policy_id' })
  cancellation_policy?: CancellationPolicy | null;

  @Column({ type: 'boolean', name: 'prepayment_required', default: () => 'FALSE' })
  prepayment_required: boolean;

  @Column({ type: 'int', name: 'min_los', nullable: true })
  min_los?: number | null;

  @Column({ type: 'int', name: 'max_los', nullable: true })
  max_los?: number | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;

  @Column({ type: 'boolean', name: 'is_active', default: () => 'TRUE' })
  is_active: boolean;
}