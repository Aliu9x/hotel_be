import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { Inventory } from './entities/inventory.entity';
import { buildDateRange } from './utils/date-range.util';
import { InventoryErrorCode, InventoryException } from './inventory-errors';
import { ReserveInventoryDto } from './dto/reserve-inventory.dto';


@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateInventoryDto): Promise<Inventory> {
    this.validateLogicalConstraint(
      dto.totalRooms,
      dto.availableRooms,
      dto.blockedRooms,
      dto.roomsSold,
    );

    const entity = this.repo.create({
      hotelId: String(dto.hotelId),
      roomTypeId: String(dto.roomTypeId),
      inventoryDate: dto.inventoryDate,
      totalRooms: dto.totalRooms,
      availableRooms: dto.availableRooms,
      blockedRooms: dto.blockedRooms,
      roomsSold: dto.roomsSold,
      stopSell: dto.stopSell,
    });

    return this.repo.save(entity);
  }

  async findRange(
    hotelId: number,
    roomTypeId: number,
    fromDate: string,
    toDate: string,
  ): Promise<Inventory[]> {
    const dates = buildDateRange(fromDate, toDate);
    return this.repo
      .createQueryBuilder('i')
      .where('i.hotelId = :hotelId', { hotelId })
      .andWhere('i.roomTypeId = :roomTypeId', { roomTypeId })
      .andWhere('i.inventoryDate IN (:...dates)', { dates })
      .orderBy('i.inventoryDate', 'ASC')
      .getMany();
  }

  async update(id: string, dto: UpdateInventoryDto): Promise<Inventory> {
    const inv = await this.repo.findOne({ where: { id } });
    if (!inv) throw new InventoryException(InventoryErrorCode.NOT_FOUND, 'Inventory not found', { id });

    if (dto.totalRooms !== undefined) inv.totalRooms = dto.totalRooms;
    if (dto.availableRooms !== undefined) inv.availableRooms = dto.availableRooms;
    if (dto.blockedRooms !== undefined) inv.blockedRooms = dto.blockedRooms;
    if (dto.roomsSold !== undefined) inv.roomsSold = dto.roomsSold;
    if (dto.stopSell !== undefined) inv.stopSell = dto.stopSell;

    this.validateLogicalConstraint(
      inv.totalRooms,
      inv.availableRooms,
      inv.blockedRooms,
      inv.roomsSold,
    );

    return this.repo.save(inv);
  }

  async adjust(id: string, dto: AdjustInventoryDto): Promise<Inventory> {
    const inv = await this.repo.findOne({ where: { id } });
    if (!inv) throw new InventoryException(InventoryErrorCode.NOT_FOUND, 'Inventory not found', { id });

    if (dto.deltaTotalRooms !== undefined) inv.totalRooms += dto.deltaTotalRooms;
    if (dto.deltaAvailableRooms !== undefined) inv.availableRooms += dto.deltaAvailableRooms;
    if (dto.deltaBlockedRooms !== undefined) inv.blockedRooms += dto.deltaBlockedRooms;
    if (dto.deltaRoomsSold !== undefined) inv.roomsSold += dto.deltaRoomsSold;

    // Overrides
    if (dto.overrideTotalRooms !== undefined) inv.totalRooms = dto.overrideTotalRooms;
    if (dto.overrideAvailableRooms !== undefined) inv.availableRooms = dto.overrideAvailableRooms;
    if (dto.overrideBlockedRooms !== undefined) inv.blockedRooms = dto.overrideBlockedRooms;
    if (dto.overrideRoomsSold !== undefined) inv.roomsSold = dto.overrideRoomsSold;

    if (dto.stopSell !== undefined) inv.stopSell = dto.stopSell;

    this.validateLogicalConstraint(
      inv.totalRooms,
      inv.availableRooms,
      inv.blockedRooms,
      inv.roomsSold,
    );

    return this.repo.save(inv);
  }

  /**
   * Giữ phòng cho khoảng ngày [fromDate, toDate) với quantity.
   * - Kiểm tra đủ bản ghi cho mọi ngày.
   * - Kiểm tra không stop_sell và availableRooms >= quantity.
   * - Pessimistic locking để tránh oversell.
   */
  async reserve(dto: ReserveInventoryDto): Promise<{ dates: string[]; quantity: number }> {
    const dates = buildDateRange(dto.fromDate, dto.toDate);
    if (dates.length === 0) {
      throw new InventoryException(InventoryErrorCode.INVALID_DATE_RANGE, 'Date range empty');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock từng row
      const inventories = await queryRunner.manager
        .createQueryBuilder(Inventory, 'i')
        .setLock('pessimistic_write')
        .where('i.hotelId = :hotelId', { hotelId: dto.hotelId })
        .andWhere('i.roomTypeId = :roomTypeId', { roomTypeId: dto.roomTypeId })
        .andWhere('i.inventoryDate IN (:...dates)', { dates })
        .orderBy('i.inventoryDate', 'ASC')
        .getMany();

      if (inventories.length !== dates.length) {
        throw new InventoryException(
          InventoryErrorCode.RANGE_INCOMPLETE,
          'Missing inventory for one or more dates',
          { expectedDates: dates, foundDates: inventories.map(i => i.inventoryDate) },
        );
      }

      for (const inv of inventories) {
        if (inv.stopSell) {
          throw new InventoryException(
            InventoryErrorCode.STOP_SELL,
            `Stop sell date ${inv.inventoryDate}`,
            { date: inv.inventoryDate },
          );
        }
        if (inv.availableRooms < dto.quantity) {
          throw new InventoryException(
            InventoryErrorCode.INSUFFICIENT_AVAILABLE,
            `Insufficient availability for ${inv.inventoryDate}`,
            { date: inv.inventoryDate, available: inv.availableRooms, required: dto.quantity },
          );
        }
      }

      // Update
      for (const inv of inventories) {
        inv.availableRooms -= dto.quantity;
        inv.roomsSold += dto.quantity;
        this.validateLogicalConstraint(
          inv.totalRooms,
          inv.availableRooms,
          inv.blockedRooms,
          inv.roomsSold,
        );
        await queryRunner.manager.save(inv);
      }

      await queryRunner.commitTransaction();
      return { dates, quantity: dto.quantity };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof InventoryException) throw err;
      throw new InventoryException(InventoryErrorCode.CONSTRAINT_VIOLATION, err.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Hủy phòng đã bán: trả lại availableRooms và giảm roomsSold
   */
  async cancel(dto: CancelReservationDto): Promise<{ dates: string[]; quantity: number }> {
    const dates = buildDateRange(dto.fromDate, dto.toDate);
    if (dates.length === 0) {
      throw new InventoryException(InventoryErrorCode.INVALID_DATE_RANGE, 'Date range empty');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventories = await queryRunner.manager
        .createQueryBuilder(Inventory, 'i')
        .setLock('pessimistic_write')
        .where('i.hotelId = :hotelId', { hotelId: dto.hotelId })
        .andWhere('i.roomTypeId = :roomTypeId', { roomTypeId: dto.roomTypeId })
        .andWhere('i.inventoryDate IN (:...dates)', { dates })
        .orderBy('i.inventoryDate', 'ASC')
        .getMany();

      if (inventories.length !== dates.length) {
        throw new InventoryException(
          InventoryErrorCode.RANGE_INCOMPLETE,
            'Missing inventory for one or more dates',
            { expectedDates: dates, foundDates: inventories.map(i => i.inventoryDate) },
        );
      }

      for (const inv of inventories) {
        if (inv.roomsSold < dto.quantity) {
          throw new InventoryException(
            InventoryErrorCode.CANCEL_EXCEEDS_SOLD,
            `Cancel quantity exceeds sold for ${inv.inventoryDate}`,
            { date: inv.inventoryDate, sold: inv.roomsSold, cancelQty: dto.quantity },
          );
        }
      }

      for (const inv of inventories) {
        inv.roomsSold -= dto.quantity;
        inv.availableRooms += dto.quantity;
        this.validateLogicalConstraint(
          inv.totalRooms,
          inv.availableRooms,
          inv.blockedRooms,
          inv.roomsSold,
        );
        await queryRunner.manager.save(inv);
      }

      await queryRunner.commitTransaction();
      return { dates, quantity: dto.quantity };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof InventoryException) throw err;
      throw new InventoryException(InventoryErrorCode.CONSTRAINT_VIOLATION, err.message);
    } finally {
      await queryRunner.release();
    }
  }

  private validateLogicalConstraint(
    total: number,
    available: number,
    blocked: number,
    sold: number,
  ) {
    if (available < 0 || blocked < 0 || sold < 0 || total < 0) {
      throw new InventoryException(
        InventoryErrorCode.CONSTRAINT_VIOLATION,
        'Negative values not allowed',
        { total, available, blocked, sold },
      );
    }
    if (available + blocked + sold > total) {
      throw new InventoryException(
        InventoryErrorCode.CONSTRAINT_VIOLATION,
        'Sum(available + blocked + sold) exceeds total',
        { total, available, blocked, sold },
      );
    }
  }
}