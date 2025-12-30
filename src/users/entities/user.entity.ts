import { Role } from 'src/interfaces/customize.interface';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';

import * as bcrypt from 'bcryptjs';
import { Hotel } from 'src/hotels/entities/hotel.entity';

export enum SignupMethod {
  SELF = 'SELF',
  ADMIN_CREATED = 'ADMIN_CREATED',
}
export enum UserStatus {
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
@Index('uq_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Column({
    type: 'enum',
    enum: SignupMethod,
    default: SignupMethod.SELF,
  })
  signup_method: SignupMethod;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.APPROVED })
  status: UserStatus;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updatedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  created_by_user?: User | null;

  @BeforeInsert()
  @BeforeUpdate()
  private async hashPassword() {
    const rounds = 10;
    const salt = await bcrypt.genSalt(rounds);
    this.password = await bcrypt.hash(this.password, salt);
  }

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @OneToMany(() => Hotel, (hotel) => hotel.created_by_user)
  created_hotels: Hotel[];
}
