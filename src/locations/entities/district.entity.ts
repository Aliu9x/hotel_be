import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Province } from './province.entity';
import { Ward } from './ward.entity';

@Entity({ name: 'districts' })
export class District {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => Province, (p) => p.districts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'province_id' })
  province: Province;

  @Column({ name: 'province_id', unsigned: true })
  province_id: number;

  @Column({ length: 16, unique: true })
  @Index()
  code: string;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 128 })
  name_ascii: string;

  @Column({ length: 128 })
  slug: string;

  @Column({ length: 32, default: 'Quận' })
  type: string;

  @Column({ length: 160, nullable: true })
  full_name?: string;

  @Column({ length: 16, default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Ward, (w) => w.district)
  wards: Ward[];
}
