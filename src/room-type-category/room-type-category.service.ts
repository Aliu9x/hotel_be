import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomTypeCategoryDto } from './dto/create-room-type-category.dto';
import { UpdateRoomTypeCategoryDto } from './dto/update-room-type-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomTypeCategory } from './entities/room-type-category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoomTypeCategoryService {
  constructor(
    @InjectRepository(RoomTypeCategory)
    private readonly repo: Repository<RoomTypeCategory>,
  ) {}
  async create(dto: CreateRoomTypeCategoryDto): Promise<RoomTypeCategory> {
    const entity = this.repo.create({ name: dto.name.trim() });
    try {
      return await this.repo.save(entity);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
        throw new ConflictException('RoomTypeCategory name already exists');
      }
      throw err;
    }
  }

  async findAll() {
    return await this.repo.find();
  }

  async findOne(id: string): Promise<RoomTypeCategory> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('RoomTypeCategory not found');
    return entity;
  }
  async update(
    id: string,
    dto: UpdateRoomTypeCategoryDto,
  ): Promise<RoomTypeCategory> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('RoomTypeCategory not found');

    if (dto.name !== undefined) {
      existing.name = dto.name.trim();
    }

    try {
      return await this.repo.save(existing);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
        throw new ConflictException('RoomTypeCategory name already exists');
      }
      throw err;
    }
  }
}
