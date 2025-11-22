import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'room_type_images' })
export class RoomTypeImage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'bigint' })
  hotel_id!: string;

  @Column({ type: 'bigint' })
  room_type_id!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 2048 })
  file_name!: string;

  @Column({ name: 'is_cover', type: 'boolean', default: false })
  is_cover!: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;
}
