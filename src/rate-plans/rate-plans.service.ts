import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatePlan } from './entities/rate-plan.entity';
import { ListRatePlansDto } from './dto/list-rate-plans.dto';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { IUser } from 'src/interfaces/customize.interface';

@Injectable()
export class RatePlanService {
  constructor(
    @InjectRepository(RatePlan)
    private readonly repo: Repository<RatePlan>,
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

    const qb = this.repo.createQueryBuilder('rp')
      .where('rp.hotel_id = :hid', { hid:user.hotel_id  });

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
  const entity = this.repo.create({
    ...dto,
    hotel_id: user.hotel_id, 
  });

  return await this.repo.save(entity);
}

  async update(id: string, dto: UpdateRatePlanDto, user: IUser) {
    const rp = await this.repo.findOne({ where: { id } });
    if (!rp) throw new NotFoundException('Rate plan not found');
    if (!user.hotel_id) {
      throw new ForbiddenException('User has no associated hotel');
    }
    Object.assign(rp, dto);
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