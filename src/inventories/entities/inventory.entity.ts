import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'inventories' })
export class Inventory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'hotel_id' })
  hotelId: string;

  @Column({ type: 'bigint', name: 'room_type_id' })
  roomTypeId: string;

  @Column({ type: 'date', name: 'inventory_date' })
  inventoryDate: string; 

  @Column({ type: 'int', name: 'total_rooms', default: 0 })
  totalRooms: number;

  @Column({ type: 'int', name: 'available_rooms', default: 0 })
  availableRooms: number;

  @Column({ type: 'int', name: 'blocked_rooms', default: 0 })
  blockedRooms: number;

  @Column({ type: 'int', name: 'rooms_sold', default: 0 })
  roomsSold: number;

  @Column({ type: 'tinyint', name: 'stop_sell', width: 1, default: 0 })
  stopSell: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updatedAt' })
  updated_at: Date;
}
