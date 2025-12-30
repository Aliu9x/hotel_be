import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { ListRoomTypesDto } from './dto/list-room-types.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IUser } from 'src/interfaces/customize.interface';
import { RoomTypeImage } from './entities/room-type-image.entity';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { RoomType } from './entities/room-type.entity';
import { log } from 'console';
import { ImageStatus } from 'src/hotels/entities/hotel-image.entity';
import { RoomTypeCategory } from 'src/room-type-category/entities/room-type-category.entity';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectRepository(RoomType)
    private readonly repo: Repository<RoomType>,
    @InjectRepository(RoomTypeImage)
    private readonly repoRt: Repository<RoomTypeImage>,
    @InjectRepository(Hotel)
    private readonly repoHt: Repository<Hotel>,
    @InjectRepository(Inventory)
    private readonly repoInventory: Repository<Inventory>,
    @InjectRepository(RoomTypeCategory)
    private readonly repoRoomTypeCategory: Repository<RoomTypeCategory>,
  ) {}

  async loadImagesFileNames(
    roomTypeId: string,
    user: IUser,
  ): Promise<{ thumbnail: string | null; slider: string[] }> {
    const hotel = await this.repoHt.findOne({ where: { id: user.hotel_id } });
    if (!hotel) {
      throw new NotFoundException('Hotel not found for current user');
    }
    const roomType = await this.repo.findOne({
      where: { id: roomTypeId, hotel_id: hotel.id },
    });
    if (!roomType) {
      throw new NotFoundException(
        'Room type not found or not belongs to your hotel',
      );
    }
    const rows = await this.repoRt.find({
      where: { room_type_id: roomTypeId, status: ImageStatus.APPROVED },
      order: { id: 'ASC' },
    });
    if (rows.length === 0) {
      return { thumbnail: null, slider: [] };
    }

    let cover = rows.find((r) => r.is_cover === true) ?? null;
    const coverId = cover?.id ?? null;
    const gallery = rows.filter((r) => r.id !== coverId);

    return {
      thumbnail: cover ? cover.file_name : null,
      slider: gallery.map((g) => g.file_name),
    };
  }

  async create(dto: CreateRoomTypeDto, user: IUser) {
    const nameRoomType = await this.repoRoomTypeCategory.findOne({
      where: { id: dto.id_category },
    });
    const maxAdults = dto.max_adults ?? 0;
    const maxChildren = dto.max_children ?? 0;
    const entity = this.repo.create({
      hotel_id: user.hotel_id,
      room_type_category: dto.id_category,
      name: nameRoomType.name,
      description: dto.description ?? null,
      total_rooms: dto.total_rooms ?? null,
      max_adults: dto.max_adults,
      max_children: dto.max_children ?? 0,
      max_occupancy: maxAdults + maxChildren,
      bed_config: dto.bed_config ?? null,
      room_size_label: dto.room_size_label ?? null,
      floor_level: dto.floor_level ?? null,
      smoking_allowed: dto.smoking_allowed ?? false,
      view: dto.view ?? null,
      is_active: dto.is_active ?? true,
    });

    const saved = await this.repo.save(entity);

    const inventories = [];
    const today = new Date();

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      inventories.push({
        hotelId: user.hotel_id,
        roomTypeId: saved.id,
        inventoryDate: d.toISOString().slice(0, 10),
        totalRooms: dto.total_rooms ?? 0,
        availableRooms: dto.total_rooms ?? 0,
        blockedRooms: 0,
        roomsSold: 0,
        stopSell: false,
      });
    }
    await this.repoInventory.insert(inventories);
    return JSON.parse(
      JSON.stringify({
        ...saved,
        inventories_created: inventories.length,
      }),
    );
  }

  async findAll(query: ListRoomTypesDto, user: IUser) {
    const {
      q,
      view,
      bed_config,
      is_active,
      max_occupancy,
      start_date,
      end_date,
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      order = 'DESC',
    } = query;

    const ALLOWED_ORDER_FIELDS = ['id', 'name', 'created_at', 'max_occupancy'];
    const safeOrderBy = ALLOWED_ORDER_FIELDS.includes(orderBy)
      ? orderBy
      : 'created_at';
    const ORDER: 'ASC' | 'DESC' =
      String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.repo.createQueryBuilder('rt');
    if (!user.hotel_id) {
      throw new ForbiddenException('Bạn không thuộc khách sạn nào');
    }

    qb.andWhere('rt.hotel_id = :hotel_id', { hotel_id: user.hotel_id });

    if (q && q.trim()) {
      qb.andWhere('LOWER(rt.name) ILIKE :kw', {
        kw: `%${q.trim().toLowerCase()}%`,
      });
    }

    if (view) {
      qb.andWhere('rt.view ILIKE :view', { view: `%${view}%` });
    }

    if (bed_config) {
      qb.andWhere('rt.bed_config ILIKE :bed_config', {
        bed_config: `%${bed_config}%`,
      });
    }

    if (typeof is_active === 'boolean') {
      qb.andWhere('rt.is_active = :is_active', { is_active });
    }

    if (max_occupancy) {
      qb.andWhere('rt.max_occupancy >= :max_occupancy', { max_occupancy });
    }

    if (start_date) {
      qb.andWhere('rt.created_at >= :start_date', { start_date });
    }
    if (end_date) {
      qb.andWhere('rt.created_at <= :end_date', { end_date });
    }

    qb.orderBy(`rt.${safeOrderBy}`, ORDER)
      .skip((page - 1) * limit)
      .take(limit);

    const [result, total] = await qb.getManyAndCount();

    return {
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
      result,
    };
  }

  async findOne(id: string): Promise<RoomType> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`RoomType ${id} not found`);
    return found;
  }

  async update(id: string, dto: UpdateRoomTypeDto, user: IUser) {
    const roomType = await this.repo.findOne({ where: { id } });
    if (!roomType) {
      throw new NotFoundException(`Không tìm thấy loại phòng ID=${id}`);
    }

    const maxAdults = dto.max_adults ?? roomType.max_adults ?? 0;
    const maxChildren = dto.max_children ?? roomType.max_children ?? 0;

    if (user.hotel_id !== undefined) roomType.hotel_id = user.hotel_id;

    if (dto.id_category !== undefined) {
      const nameRoomType = await this.repoRoomTypeCategory.findOne({
        where: { id: dto.id_category },
      });
      roomType.room_type_category = dto.id_category;
      roomType.name = nameRoomType.name;
    }
    if (dto.description !== undefined)
      roomType.description = dto.description ?? null;
    if (dto.total_rooms !== undefined) roomType.total_rooms = dto.total_rooms;
    if (dto.max_adults !== undefined) roomType.max_adults = dto.max_adults;
    if (dto.max_children !== undefined)
      roomType.max_children = dto.max_children;
    if (dto.bed_config !== undefined)
      roomType.bed_config = dto.bed_config ?? null;
    if (dto.room_size_label !== undefined)
      roomType.room_size_label = dto.room_size_label ?? null;
    if (dto.floor_level !== undefined)
      roomType.floor_level = dto.floor_level ?? null;
    if (dto.smoking_allowed !== undefined)
      roomType.smoking_allowed = dto.smoking_allowed;
    if (dto.view !== undefined) roomType.view = dto.view ?? null;
    if (dto.is_active !== undefined) roomType.is_active = dto.is_active;
    roomType.max_occupancy = maxAdults + maxChildren;
    roomType.updated_at = new Date();
    const saved = await this.repo.save(roomType);
    if (dto.total_rooms !== undefined) {
      const inventories = await this.repoInventory.find({
        where: {
          roomTypeId: saved.id,
        },
      });
      for (const inv of inventories) {
        inv.totalRooms = dto.total_rooms;

        const recalculatedAvailable =
          dto.total_rooms - inv.roomsSold - inv.blockedRooms;

        inv.availableRooms = Math.max(0, recalculatedAvailable);
      }
      await this.repoInventory.save(inventories);
    }
    return saved;
  }

  async removeHard(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException(`RoomType ${id} not found`);
  }
}
