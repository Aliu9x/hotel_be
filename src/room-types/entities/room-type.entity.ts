import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'room_types' })
@Index('idx_room_types_hotel_active', ['hotel_id', 'is_active'])
@Index('idx_room_types_name', ['name'])
export class RoomType {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', nullable: true })
  total_rooms?: number | null;

  @Column({ type: 'int' })
  max_adults: number;

  @Column({ type: 'int', default: () => '0' })
  max_children: number;

  @Column({ type: 'int' })
  max_occupancy: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bed_config?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room_size_label?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  floor_level?: string | null;

  @Column({ type: 'boolean', default: false })
  smoking_allowed: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  view?: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
