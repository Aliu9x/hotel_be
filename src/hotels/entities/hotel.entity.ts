import { District } from 'src/locations/entities/district.entity';
import { Province } from 'src/locations/entities/province.entity';
import { Ward } from 'src/locations/entities/ward.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum HotelApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('hotels')
@Index('idx_hotels_city', ['city'])
@Index('idx_hotels_province_id', ['province_id'])
@Index('idx_hotels_district_id', ['district_id'])
@Index('idx_hotels_ward_id', ['ward_id'])
export class Hotel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ward?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province?: string;

  // Location IDs
  @Column({ type: 'int', unsigned: true, nullable: true })
  province_id?: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  district_id?: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  ward_id?: number;

  @ManyToOne(() => Province, { nullable: true })
  @JoinColumn({ name: 'province_id' })
  province_ref?: Province;

  @ManyToOne(() => District, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district_ref?: District;

  @ManyToOne(() => Ward, { nullable: true })
  @JoinColumn({ name: 'ward_id' })
  ward_ref?: Ward;

  @Column({ type: 'char', length: 2, default: 'VN', name: 'country_code' })
  country_code: string;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @Column({
    type: 'enum',
    enum: HotelApprovalStatus,
    default: HotelApprovalStatus.PENDING,
    name: 'approval_status',
  })
  approval_status: HotelApprovalStatus;

  @Column({ type: 'int', nullable: true, comment: 'Số sao khách sạn (1-5)' })
  star_rating?: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.created_hotels)
  @JoinColumn({ name: 'created_by_user_id' })
  created_by_user: User;

  @Column({ nullable: true })
  created_by_user_id: string;
}