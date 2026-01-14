import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { IUser } from 'src/interfaces/customize.interface';
import { RoomType } from 'src/room-types/entities/room-type.entity';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,

    private readonly dataSource: DataSource,
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

  /**
   * Tạo mảng ngày dạng YYYY-MM-DD từ checkIn (bao gồm) tới checkOut (không bao gồm)
   * Mỗi phần tử đại diện cho 1 đêm.
   */
  private buildDateRange(checkInDate: string, checkOutDate: string): string[] {
    const start = new Date(`${checkInDate}T00:00:00Z`);
    const end = new Date(`${checkOutDate}T00:00:00Z`);
    if (
      !(start instanceof Date) ||
      isNaN(start.getTime()) ||
      !(end instanceof Date) ||
      isNaN(end.getTime())
    ) {
      throw new BadRequestException('Ngày không hợp lệ (YYYY-MM-DD)');
    }
    if (end <= start) {
      throw new BadRequestException('checkOutDate phải lớn hơn checkInDate');
    }

    const days: string[] = [];
    for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  /**
   * Giữ phòng theo khoảng ngày:
   * - Với mỗi đêm trong khoảng [checkIn, checkOut), chuyển availableRooms -> blockedRooms theo quantity
   */
  async holdRoomsRange(
    hotelId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number,
  ) {
    if (quantity <= 0) throw new BadRequestException('Số lượng phải > 0');

    const dates = this.buildDateRange(checkInDate, checkOutDate);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const invRepo = queryRunner.manager.getRepository(Inventory);

      // Khóa tất cả các bản ghi inventory trong khoảng ngày
      const inventories = await invRepo
        .createQueryBuilder('inv')
        .where('inv.hotel_id = :hotelId', { hotelId })
        .andWhere('inv.room_type_id = :roomTypeId', { roomTypeId })
        .andWhere('inv.inventory_date IN (:...dates)', { dates })
        .setLock('pessimistic_write')
        .getMany();

      if (inventories.length !== dates.length) {
        throw new BadRequestException(
          'Thiếu dữ liệu inventory cho một hoặc nhiều ngày trong khoảng',
        );
      }

      // Kiểm tra đủ điều kiện cho toàn bộ khoảng
      for (const inv of inventories) {
        if (inv.stopSell)
          throw new BadRequestException(
            `Ngày ${inv.inventoryDate} đang stop-sell`,
          );
        if (inv.availableRooms < quantity) {
          throw new BadRequestException(
            `Không đủ phòng trống để giữ vào ngày ${inv.inventoryDate}`,
          );
        }
      }

      // Áp dụng giữ phòng cho toàn bộ khoảng
      for (const inv of inventories) {
        inv.availableRooms -= quantity;
        inv.blockedRooms += quantity;

        const total = inv.availableRooms + inv.blockedRooms + inv.roomsSold;
        if (
          inv.availableRooms < 0 ||
          inv.blockedRooms < 0 ||
          inv.roomsSold < 0 ||
          total > inv.totalRooms
        ) {
          throw new BadRequestException(
            `Số liệu không hợp lệ vào ngày ${inv.inventoryDate}`,
          );
        }
      }

      await invRepo.save(inventories);
      await queryRunner.commitTransaction();

      return { status: 'held', dates, inventories };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Xác nhận đặt phòng theo khoảng ngày:
   * - Nếu fromHold=true: chuyển blockedRooms -> roomsSold cho toàn bộ đêm
   * - Nếu fromHold=false: chuyển availableRooms -> roomsSold trực tiếp cho toàn bộ đêm
   */
  async confirmBookingRange(
    hotelId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number,
    options?: { fromHold?: boolean },
  ) {
    if (quantity <= 0) throw new BadRequestException('Số lượng phải > 0');

    const dates = this.buildDateRange(checkInDate, checkOutDate);
    const fromHold = options?.fromHold ?? false;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const invRepo = queryRunner.manager.getRepository(Inventory);

      const inventories = await invRepo
        .createQueryBuilder('inv')
        .where('inv.hotel_id = :hotelId', { hotelId })
        .andWhere('inv.room_type_id = :roomTypeId', { roomTypeId })
        .andWhere('inv.inventory_date IN (:...dates)', { dates })
        .setLock('pessimistic_write')
        .getMany();

      if (inventories.length !== dates.length) {
        throw new BadRequestException(
          'Thiếu dữ liệu inventory cho một hoặc nhiều ngày trong khoảng',
        );
      }

      for (const inv of inventories) {
        if (inv.stopSell)
          throw new BadRequestException(
            `Ngày ${inv.inventoryDate} đang stop-sell`,
          );

        if (fromHold) {
          if (inv.blockedRooms < quantity) {
            throw new BadRequestException(
              `Không đủ phòng đã giữ để xác nhận vào ngày ${inv.inventoryDate}`,
            );
          }
          inv.blockedRooms -= quantity;
          inv.roomsSold += quantity;
        } else {
          if (inv.availableRooms < quantity) {
            throw new BadRequestException(
              `Không đủ phòng trống để đặt vào ngày ${inv.inventoryDate}`,
            );
          }
          inv.availableRooms -= quantity;
          inv.roomsSold += quantity;
        }

        const total = inv.availableRooms + inv.blockedRooms + inv.roomsSold;
        if (
          inv.availableRooms < 0 ||
          inv.blockedRooms < 0 ||
          inv.roomsSold < 0 ||
          total > inv.totalRooms
        ) {
          throw new BadRequestException(
            `Số liệu không hợp lệ vào ngày ${inv.inventoryDate}`,
          );
        }
      }

      await invRepo.save(inventories);
      await queryRunner.commitTransaction();

      return { status: 'confirmed', dates, inventories };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Trả giữ (release hold) theo khoảng ngày: chuyển blockedRooms -> availableRooms cho toàn bộ đêm.
   */
  async releaseHoldRange(
    hotelId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number,
  ) {
    if (quantity <= 0) throw new BadRequestException('Số lượng phải > 0');

    const dates = this.buildDateRange(checkInDate, checkOutDate);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const invRepo = queryRunner.manager.getRepository(Inventory);

      const inventories = await invRepo
        .createQueryBuilder('inv')
        .where('inv.hotel_id = :hotelId', { hotelId })
        .andWhere('inv.room_type_id = :roomTypeId', { roomTypeId })
        .andWhere('inv.inventory_date IN (:...dates)', { dates })
        .setLock('pessimistic_write')
        .getMany();

      if (inventories.length !== dates.length) {
        throw new BadRequestException(
          'Thiếu dữ liệu inventory cho một hoặc nhiều ngày trong khoảng',
        );
      }

      for (const inv of inventories) {
        if (inv.blockedRooms < quantity) {
          throw new BadRequestException(
            `Không đủ phòng đang giữ để trả lại vào ngày ${inv.inventoryDate}`,
          );
        }
        inv.blockedRooms -= quantity;
        inv.availableRooms += quantity;

        const total = inv.availableRooms + inv.blockedRooms + inv.roomsSold;
        if (
          inv.availableRooms < 0 ||
          inv.blockedRooms < 0 ||
          inv.roomsSold < 0 ||
          total > inv.totalRooms
        ) {
          throw new BadRequestException(
            `Số liệu không hợp lệ vào ngày ${inv.inventoryDate}`,
          );
        }
      }

      await invRepo.save(inventories);
      await queryRunner.commitTransaction();

      return { status: 'released', dates, inventories };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Hủy đặt phòng theo khoảng ngày: chuyển roomsSold -> availableRooms cho toàn bộ đêm.
   */
  async cancelBookingRange(
    hotelId: string,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number,
  ) {
    if (quantity <= 0) throw new BadRequestException('Số lượng phải > 0');

    const dates = this.buildDateRange(checkInDate, checkOutDate);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('READ COMMITTED');

    try {
      const invRepo = queryRunner.manager.getRepository(Inventory);

      const inventories = await invRepo
        .createQueryBuilder('inv')
        .where('inv.hotel_id = :hotelId', { hotelId })
        .andWhere('inv.room_type_id = :roomTypeId', { roomTypeId })
        .andWhere('inv.inventory_date IN (:...dates)', { dates })
        .setLock('pessimistic_write')
        .getMany();

      if (inventories.length !== dates.length) {
        throw new BadRequestException(
          'Thiếu dữ liệu inventory cho một hoặc nhiều ngày trong khoảng',
        );
      }

      for (const inv of inventories) {
        if (inv.roomsSold < quantity) {
          throw new BadRequestException(
            `Không đủ phòng đã bán để hủy vào ngày ${inv.inventoryDate}`,
          );
        }
        inv.roomsSold -= quantity;
        inv.availableRooms += quantity;

        const total = inv.availableRooms + inv.blockedRooms + inv.roomsSold;
        if (
          inv.availableRooms < 0 ||
          inv.blockedRooms < 0 ||
          inv.roomsSold < 0 ||
          total > inv.totalRooms
        ) {
          throw new BadRequestException(
            `Số liệu không hợp lệ vào ngày ${inv.inventoryDate}`,
          );
        }
      }

      await invRepo.save(inventories);
      await queryRunner.commitTransaction();

      return { status: 'canceled', dates, inventories };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
