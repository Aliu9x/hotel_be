import { Amenity } from 'src/amenity-category/entities/amenity.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity({ name: 'amenity_mappings' })
@Unique('uq_mapping', ['hotel_id', 'room_type_id', 'amenity_id'])
@Index('idx_hotel', ['hotel_id'])
@Index('idx_room_type', ['room_type_id'])
export class AmenityMapping {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'hotel_id' })
  hotel_id: string;

  @Column({ type: 'bigint', name: 'room_type_id', nullable: true })
  room_type_id?: string | null;

  @Column({ type: 'bigint', name: 'amenity_id' })
  amenity_id: string;

  @ManyToOne(() => Amenity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: Amenity;

  @ManyToOne(() => RoomType, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'room_type_id' })
  room_type?: RoomType;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
