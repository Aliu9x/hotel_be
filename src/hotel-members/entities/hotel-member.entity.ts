import { Hotel } from 'src/hotels/entities/hotel.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';


@Entity('hotel_members')
@Unique('uq_hotel_user', ['hotel_id', 'user_id'])
@Index('idx_hotelmembers_user', ['user_id'])
export class HotelMember {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'bigint' })
  user_id: string;

  @Column({ type: 'tinyint', default: () => '1' })
  is_active: boolean;

  @Column({ type: 'bigint', nullable: true })
  added_by_user_id?: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'added_by_user_id' })
  added_by_user?: User | null;
}