import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
export enum HotelModuleCode {
  LISTING = 'LISTING',
  PMS = 'PMS',
  BILLING = 'BILLING',
  REPORT = 'REPORT',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

@Entity('hotel_modules')
@Index('idx_hotel_modules_is_published', ['is_published'])
export class HotelModule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({
    type: 'enum',
    enum: HotelModuleCode,
    default: HotelModuleCode.LISTING,
  })
  module_code: HotelModuleCode;
  
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'tinyint', default: () => '0' })
  is_published: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;
}
