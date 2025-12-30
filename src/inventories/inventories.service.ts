import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { Inventory } from './entities/inventory.entity';
import { buildDateRange } from './utils/date-range.util';
import { InventoryErrorCode, InventoryException } from './inventory-errors';
import { ReserveInventoryDto } from './dto/reserve-inventory.dto';
import { IUser } from 'src/interfaces/customize.interface';
import { RoomType } from 'src/room-types/entities/room-type.entity';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
  ) {}

  async getByRoomType(
    user: IUser,
    roomTypeId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    if (!user.hotel_id) {
      throw new ForbiddenException('User chưa gắn khách sạn');
    }

    const roomType = await this.roomTypeRepo.findOne({
      where: {
        id: roomTypeId,
        hotel_id: user.hotel_id,
      },
    });

    if (!roomType) {
      throw new ForbiddenException('RoomType không thuộc khách sạn');
    }

    const where: any = {
      hotelId: user.hotel_id,
      roomTypeId: roomTypeId,
    };

    if (fromDate && toDate) {
      where.inventoryDate = Between(fromDate, toDate);
    }

    return this.inventoryRepo.find({
      where,
      order: { inventoryDate: 'ASC' },
    });
  }
}
