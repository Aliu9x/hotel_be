import { RoomType } from 'src/room-types/entities/room-type.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'inventories' })
@Index('idx_inventories_hotel_room_date', ['hotel_id', 'room_type_id', 'date'])
export class Inventory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'bigint' })
  room_type_id: string;

  @ManyToOne(() => RoomType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'room_type_id' })
  room_type?: RoomType;

  // store local date (no time)
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', default: () => '0' })
  allotment: number;

  @Column({ type: 'int', default: () => '0' })
  sold: number;

  @Column({ type: 'boolean', default: () => 'FALSE' })
  stop_sell: boolean;

 @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;
}