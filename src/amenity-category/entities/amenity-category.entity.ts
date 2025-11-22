import { Amenity } from 'src/amenity-category/entities/amenity.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AmenityApplyTo {
  Hotel = 'Hotel',
  RoomType = 'Room',
}

@Entity({ name: 'amenity_categories' })
export class AmenityCategory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'name_category' })
  name_category: string;

  @Column({
    type: 'enum',
    enum: AmenityApplyTo,
    enumName: 'amenity_apply_to',
    default: AmenityApplyTo.Hotel,
  })
  applies_to: AmenityApplyTo;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Amenity, (a) => a.category, { cascade: true })
  amenities: Amenity[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
