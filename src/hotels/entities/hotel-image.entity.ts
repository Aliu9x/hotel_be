import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
export enum ImageStatus {
  PENDING_AI = 'PENDING_AI',
  APPROVED = 'APPROVED',
  AI_FLAGGED = 'AI_FLAGGED',
  REJECTED = 'REJECTED',
}
@Entity({ name: 'hotel_images' })
@Index('idx_hotelimages_hotel_sort', ['hotel_id'])
export class HotelImage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'bigint' })
  hotel_id!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 2048 })
  file_name!: string;

  @Column({ name: 'is_cover', type: 'boolean', default: false })
  is_cover!: boolean;

  @Column({
    type: 'enum',
    enum: ImageStatus,
    default: ImageStatus.PENDING_AI,
  })
  status: ImageStatus;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;
}
