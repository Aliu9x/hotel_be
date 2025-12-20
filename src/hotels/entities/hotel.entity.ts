import { District } from 'src/locations/entities/district.entity';
import { Province } from 'src/locations/entities/province.entity';
import { Ward } from 'src/locations/entities/ward.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
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
  OneToMany,
} from 'typeorm';

export type HotelApprovalStatus = 'PENDING' | 'APPROVED'|'SUSPENDED';

@Entity('hotels')
@Index('idx_hotels_province_id', ['province_id'])
@Index('idx_hotels_district_id', ['district_id'])
@Index('idx_hotels_ward_id', ['ward_id'])
export class Hotel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  registration_code?: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  approval_status: HotelApprovalStatus;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  star_rating?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address_line?: string;

  @Column({ type: 'int', nullable: true })
  province_id?: number;

  @Column({ type: 'int', nullable: true })
  district_id?: number;

  @Column({ type: 'int', nullable: true })
  ward_id?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  province_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  district_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ward_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact_email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact_phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legal_name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legal_address?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signer_full_name?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  signer_phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  signer_email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  identity_doc_filename?: string; 

  @Column({ type: 'varchar', length: 255, nullable: true })
  contract_pdf_filename?: string; 

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.created_hotels, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  created_by_user?: User;

  @Column({ nullable: true })
  created_by_user_id?: string;

  @OneToMany(() => RoomType, (rt) => rt.hotel_id)
  room_types: RoomType[];
}
