import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { Repository } from 'typeorm';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { ListInventoriesDto } from './dto/list-inventories.dto';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private readonly repo: Repository<Inventory>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
  ) {}

  private async ensureRoomTypeBelongsToHotel(
    room_type_id: string,
    hotel_id: string,
  ) {
    const rt = await this.roomTypeRepo.findOne({ where: { id: room_type_id } });
    if (!rt) throw new NotFoundException(`RoomType ${room_type_id} not found`);
    if (rt.hotel_id !== hotel_id) {
      throw new BadRequestException(
        'RoomType does not belong to provided hotel_id',
      );
    }
  }

  // Create or upsert inventory for given hotel_id, room_type_id and date
  async create(dto: CreateInventoryDto): Promise<Inventory> {
    await this.ensureRoomTypeBelongsToHotel(dto.room_type_id, dto.hotel_id);

    const existing = await this.repo.findOne({
      where: {
        hotel_id: dto.hotel_id,
        room_type_id: dto.room_type_id,
        date: dto.date,
      },
    });

    if (existing) {
      existing.allotment = dto.allotment ?? existing.allotment;
      existing.sold = dto.sold ?? existing.sold;
      existing.stop_sell = dto.stop_sell ?? existing.stop_sell;
      return this.repo.save(existing);
    }

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(query: ListInventoriesDto) {
    const {
      hotel_id,
      room_type_id,
      date,
      date_from,
      date_to,
      stop_sell,
      q,
      page = 1,
      limit = 50,
      orderBy = 'date',
      order = 'ASC',
    } = query;

    const qb = this.repo.createQueryBuilder('inv');
    // join room_type so we can search on its name with LIKE (MySQL)
    qb.leftJoinAndSelect('inv.room_type', 'rt');

    if (hotel_id) qb.andWhere('inv.hotel_id = :hotel_id', { hotel_id });
    if (room_type_id)
      qb.andWhere('inv.room_type_id = :room_type_id', { room_type_id });
    if (date) qb.andWhere('inv.date = :date', { date });
    if (date_from) qb.andWhere('inv.date >= :date_from', { date_from });
    if (date_to) qb.andWhere('inv.date <= :date_to', { date_to });
    if (typeof stop_sell === 'boolean')
      qb.andWhere('inv.stop_sell = :stop_sell', { stop_sell });

    // q searches the room type name using MySQL LIKE (case depends on collation)
    if (q) {
      qb.andWhere('rt.name LIKE :q', { q: `%${q}%` });
    }

    // whitelist orderBy to avoid SQL injection
    qb.orderBy(`inv.${orderBy}`, order as 'ASC' | 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<Inventory> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`Inventory ${id} not found`);
    return found;
  }

  async update(id: string, dto: UpdateInventoryDto): Promise<Inventory> {
    const entity = await this.findOne(id);

    if (dto.room_type_id && dto.hotel_id) {
      await this.ensureRoomTypeBelongsToHotel(dto.room_type_id, dto.hotel_id);
    } else if (dto.room_type_id && !dto.hotel_id) {
      // if room_type changed validate it still belongs to existing inventory.hotel_id
      await this.ensureRoomTypeBelongsToHotel(
        dto.room_type_id,
        entity.hotel_id,
      );
    } else if (!dto.room_type_id && dto.hotel_id) {
      // if hotel changed validate existing room_type belongs to new hotel
      await this.ensureRoomTypeBelongsToHotel(
        entity.room_type_id,
        dto.hotel_id,
      );
    }

    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException(`Inventory ${id} not found`);
  }
}
