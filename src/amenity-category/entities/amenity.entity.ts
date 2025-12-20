import { AmenityCategory } from 'src/amenity-category/entities/amenity-category.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'amenities' })
export class Amenity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: false, name: 'show_in_search' })
  show_in_search: boolean;

  @ManyToOne(() => AmenityCategory, (category) => category.amenities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: AmenityCategory;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
