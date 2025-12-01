import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { District } from './district.entity';

@Entity({ name: 'provinces' })
export class Province {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ length: 16, unique: true })
  @Index()
  code: string;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 128 })
  name_ascii: string;

  @Column({ length: 128 })
  slug: string;

  @Column({ length: 32, default: 'Tỉnh' })
  type: string;

  @Column({ length: 160, nullable: true })
  full_name?: string;

  @Column({ length: 16, default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => District, (d) => d.province)
  districts: District[];
}
