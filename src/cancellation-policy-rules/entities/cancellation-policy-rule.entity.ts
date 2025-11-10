import { CancellationPolicy, PenaltyType } from 'src/cancellation-policies/entities/cancellation-policy.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'cancellation_policy_rules' })
@Index('idx_cpr_policy', ['policy_id'])
@Index('uq_cpr_policy_day', ['policy_id', 'days_before_checkin'], { unique: true })
export class CancellationPolicyRule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'policy_id' })
  policy_id: string;

  @ManyToOne(() => CancellationPolicy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policy_id' })
  policy?: CancellationPolicy;

  @Column({ type: 'int', name: 'days_before_checkin' })
  days_before_checkin: number;

  @Column({
    type: 'enum',
    enum: PenaltyType,
    enumName: 'penalty_type', // reuse enum name
    name: 'penalty_type',
  })
  penalty_type: PenaltyType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'penalty_value',
  })
  penalty_value: string; // store as string to keep precision
}