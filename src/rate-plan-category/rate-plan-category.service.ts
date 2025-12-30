import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRatePlanCategoryDto } from './dto/create-rate-plan-category.dto';
import { UpdateRatePlanCategoryDto } from './dto/update-rate-plan-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatePlanCategory } from './entities/rate-plan-category.entity';
@Injectable()
export class RatePlanCategoryService {
  constructor(
    @InjectRepository(RatePlanCategory)
    private readonly repo: Repository<RatePlanCategory>,
  ) {}
  async create(dto:CreateRatePlanCategoryDto ): Promise<RatePlanCategory> {
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

  async findOne(id: string): Promise<RatePlanCategory> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('RoomTypeCategory not found');
    return entity;
  }
  async update(
    id: string,
    dto: UpdateRatePlanCategoryDto,
  ): Promise<RatePlanCategory> {
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
