import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatePlan } from './entities/rate-plan.entity';
import { ListRatePlansDto } from './dto/list-rate-plans.dto';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { IUser } from 'src/interfaces/customize.interface';
import { RatePlanCategory } from 'src/rate-plan-category/entities/rate-plan-category.entity';

@Injectable()
export class RatePlanService {
  constructor(
    @InjectRepository(RatePlan)
    private readonly repo: Repository<RatePlan>,
    @InjectRepository(RatePlanCategory)
    private readonly repoRatePlanCategory: Repository<RatePlanCategory>,
  ) {}

  async findAll(user: IUser, query: ListRatePlansDto) {
    if (!user.hotel_id) {
      throw new ForbiddenException('User has no associated hotel');
    }
    const {
      q,
      room_type_id,
      page = 1,
      limit = 10,
      orderBy = 'created_at',
      order = 'DESC',
    } = query;

    const qb = this.repo
      .createQueryBuilder('rp')
      .where('rp.hotel_id = :hid', { hid: user.hotel_id });

    if (q && q.trim()) {
      qb.andWhere('rp.name ILIKE :q', { q: `%${q.trim()}%` });
    }
    if (room_type_id) {
      qb.andWhere('rp.room_type_id = :rtid', { rtid: room_type_id });
    }

    const total = await qb.getCount();

    qb.orderBy(`rp.${orderBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const result = await qb.getMany();
    return {
      meta: { page, limit, pages: Math.ceil(total / limit), total },
      result,
    };
  }

  async findOne(id: string, user: IUser) {
    const rp = await this.repo.findOne({ where: { id } });
    if (!rp) throw new NotFoundException('Rate plan not found');
    if (!user.hotel_id) {
      throw new ForbiddenException('User has no associated hotel');
    }
    return rp;
  }

  async create(dto: CreateRatePlanDto, user: IUser) {
    const rate_plan = await this.repoRatePlanCategory.findOne({
      where: { id: dto.rate_plan_category_id },
    });

    const entity = this.repo.create({
      ...dto,
      name: rate_plan.name,
      hotel_id: user.hotel_id,
    });

    return await this.repo.save(entity);
  }

async update(id: string, dto: UpdateRatePlanDto, user: IUser) {
  if (!user.hotel_id) {
    throw new ForbiddenException('User has no associated hotel');
  }

  const rp = await this.repo.findOne({ where: { id, hotel_id: user.hotel_id } });
  if (!rp) throw new NotFoundException('Rate plan not found');

  if (dto.rate_plan_category_id !== undefined && dto.rate_plan_category_id !== null) {
    const category = await this.repoRatePlanCategory.findOne({
      where: { id: dto.rate_plan_category_id },
    });
    if (!category) {
      throw new NotFoundException('Rate plan category not found');
    }
    rp.rate_plan_category_id = category.id; 
    rp.name = category.name;
  }

  if (dto.room_type_id !== undefined) rp.room_type_id = dto.room_type_id;
  if (dto.description !== undefined) rp.description = dto.description?.trim();
  if (dto.price_amount !== undefined) rp.price_amount = dto.price_amount;
  if (dto.base_occupancy !== undefined) rp.base_occupancy = dto.base_occupancy;
  if (dto.max_occupancy !== undefined) rp.max_occupancy = dto.max_occupancy;
  if (dto.extra_adult_fee !== undefined) rp.extra_adult_fee = dto.extra_adult_fee;
  if (dto.extra_child_fee !== undefined) rp.extra_child_fee = dto.extra_child_fee;
  if (dto.prepayment_required !== undefined) rp.prepayment_required = !!dto.prepayment_required;

  return await this.repo.save(rp);
}

  async remove(id: string, user: IUser) {
    const rp = await this.repo.findOne({ where: { id } });
    if (!rp) throw new NotFoundException('Rate plan not found');
    if (!user.hotel_id) {
      throw new ForbiddenException('User has no associated hotel');
    }
    await this.repo.remove(rp);
    return { success: true };
  }
}
