import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PenaltyType {
  PERCENT = 'PERCENT', // value is 0..100 (percent)
  AMOUNT = 'AMOUNT', // fixed currency amount
  NIGHTS = 'NIGHTS', // number of nights
}

@Entity({ name: 'cancellation_policies' })
@Index('idx_cp_hotel', ['hotel_id'])
export class CancellationPolicy {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({
    type: 'enum',
    enum: PenaltyType,
    enumName: 'penalty_type',
    default: PenaltyType.PERCENT,
    name: 'no_show_penalty_type',
  })
  no_show_penalty_type: PenaltyType;

  // Store as string to preserve decimal(12,2) precision
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: () => '100.00', // default 100%
    name: 'no_show_penalty_value',
  })
  no_show_penalty_value: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;
}
