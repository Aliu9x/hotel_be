import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AmenityApplyTo {
  Hotel = 'Hotel',
  RoomType = 'RoomType',
  Both = 'Both',
}

@Entity({ name: 'amenities' })
export class Amenity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string | null;

  @Column({
    type: 'enum',
    enum: AmenityApplyTo,
    enumName: 'amenity_apply_to',
    default: AmenityApplyTo.Both,
    name: 'applies_to',
  })
  applies_to: AmenityApplyTo;

  @Column({ type: 'boolean', default: () => 'TRUE' })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;
}
