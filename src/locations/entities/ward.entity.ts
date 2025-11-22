import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { District } from './district.entity';

@Entity({ name: 'wards' })
export class Ward {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @ManyToOne(() => District, (d) => d.wards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'district_id' })
  district: District;

  @Column({ name: 'district_id', unsigned: true })
  @Index()
  district_id: number;

  @Column({ length: 16, unique: true })
  code: string;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 128 })
  name_ascii: string;

  @Column({ length: 128 })
  slug: string;

  @Column({ length: 32, default: 'Phường' })
  type: string;

  @Column({ length: 160, nullable: true })
  full_name?: string;

  @Column({ length: 16, default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
