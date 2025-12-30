import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'room_type_categories' })
export class RoomTypeCategory {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
  
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
}
