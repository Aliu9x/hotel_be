import { Hotel } from 'src/hotels/entities/hotel.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('hotel_display_policies')
@Unique('uq_hotel_display_policies_hotel', ['hotel_id'])
export class HotelPolicy {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'time', nullable: true })
  default_checkin_time?: string | null;

  @Column({ type: 'time', nullable: true })
  default_checkout_time?: string | null;

  @Column({ type: 'text', nullable: true })
  house_rules?: string | null;

  @Column({ type: 'text', nullable: true })
  children_policy?: string | null;

  @Column({ type: 'text', nullable: true })
  smoking_policy?: string | null;

  @Column({ type: 'text', nullable: true })
  pets_policy?: string | null;

  @Column({ type: 'text', nullable: true })
  other_policies?: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;

  @ManyToOne(() => Hotel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_id' })
  hotel?: Hotel;
}
