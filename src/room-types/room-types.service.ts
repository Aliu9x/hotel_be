import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { RoomType } from './entities/room-type.entity';
import { ListRoomTypesDto } from './dto/list-room-types.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IUser } from 'src/interfaces/customize.interface';

@Injectable()
export class RoomTypesService {
  constructor(
    @InjectRepository(RoomType)
    private readonly repo: Repository<RoomType>,
  ) {}
  async create(dto: CreateRoomTypeDto, user: IUser) {
    const entity = this.repo.create({
      hotel_id: user.hotel_id,
      name: dto.name,
      description: dto.description ?? null,
      total_rooms: dto.total_rooms ?? null,
      max_adults: dto.max_adults,
      max_children: dto.max_children ?? 0,
      max_occupancy: dto.max_occupancy,
      bed_config: dto.bed_config ?? null,
      room_size_label: dto.room_size_label ?? null,
      floor_level: dto.floor_level ?? null,
      smoking_allowed: dto.smoking_allowed ?? false,
      view: dto.view ?? null,
      is_active: dto.is_active ?? true,
    });
    const saved = await this.repo.save(entity);
    return { data: saved };
  }

  async findAll(query: ListRoomTypesDto) {
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

    if (user.hotel_id !== undefined) roomType.hotel_id = user.hotel_id;
    if (dto.name !== undefined) roomType.name = dto.name;
    if (dto.description !== undefined)
      roomType.description = dto.description ?? null;
    if (dto.total_rooms !== undefined) roomType.total_rooms = dto.total_rooms;
    if (dto.max_adults !== undefined) roomType.max_adults = dto.max_adults;
    if (dto.max_children !== undefined)
      roomType.max_children = dto.max_children;
    if (dto.max_occupancy !== undefined)
      roomType.max_occupancy = dto.max_occupancy;
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

    roomType.updated_at = new Date();

    const saved = await this.repo.save(roomType);
    return { data: saved };
  }

  async removeHard(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException(`RoomType ${id} not found`);
  }
}
