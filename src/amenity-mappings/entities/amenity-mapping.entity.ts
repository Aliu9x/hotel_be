import { Amenity } from 'src/amenity/entities/amenity.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum AmenityEntityType {
  Hotel = 'Hotel',
  RoomType = 'RoomType',
}

@Entity({ name: 'amenity_mappings' })
@Index('idx_am_entity', [ 'entity_id'])
@Index('idx_am_amenity', ['amenity_id'])
@Index('uq_am_entity_amenity', ['entity_id', 'amenity_id'], {
  unique: true,
})
export class AmenityMapping {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hotel_id: string;

  @Column({ type: 'bigint' })
  entity_id: string;

  @Column({
    type: 'enum',
    enum: AmenityEntityType,
    enumName: 'amenity_entity_type',
  })
  entity_type: AmenityEntityType;

  @Column({ type: 'bigint', name: 'amenity_id' })
  amenity_id: string;

  @ManyToOne(() => Amenity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'amenity_id' })
  amenity?: Amenity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  value?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;
}