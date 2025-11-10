import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Amenity } from './entities/amenity.entity';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { ListAmenitiesDto } from './dto/list-amenities.dto';

@Injectable()
export class AmenityService {
  constructor(
    @InjectRepository(Amenity)
    private readonly repo: Repository<Amenity>,
  ) {}

  async create(dto: CreateAmenityDto): Promise<Amenity> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(query: ListAmenitiesDto): Promise<{
    meta: { total: number; page: number; limit: number; pageSize: number };
    data: Amenity[];
  }> {
    const {
      q,
      applies_to,
      category,
      is_active,
      limit = 10,
      order = 'DESC',
      orderBy = 'created_at',
      page = 1,
    } = query;

    const qb = this.repo.createQueryBuilder('a');

    if (q?.trim()) {
      qb.andWhere('a.name LIKE :q', { q: `%${q}%` });
    }

    if (typeof is_active === 'boolean') {
      qb.andWhere('a.is_active = :is_active', { is_active });
    }

    if (category?.trim()) {
      qb.andWhere('a.category LIKE :category', {
        category: `%${category}%`,
      });
    }

    if (applies_to) {
      qb.andWhere('a.applies_to = :applies_to', { applies_to });
    }
    qb.orderBy(`a.${orderBy}`, order as 'ASC' | 'DESC');

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const pageSize = Math.max(Math.ceil(total / limit), 1);

    return {
      meta: {
        total,
        page,
        limit,
        pageSize,
      },
      data,
    };
  }

  async findOne(id: string): Promise<Amenity> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Amenity ${id} not found`);
    }
    return found;
  }

  async update(id: string, dto: UpdateAmenityDto): Promise<Amenity> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<Amenity> {
    const entity = await this.findOne(id);
    if (!entity.is_active) {
      return entity;
    }
    entity.is_active = false;
    return this.repo.save(entity);
  }

  async removeHard(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`Amenity ${id} not found`);
    }
  }
}
