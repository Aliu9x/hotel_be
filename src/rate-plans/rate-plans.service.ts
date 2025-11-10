import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRatePlanDto } from './dto/create-rate-plan.dto';
import { UpdateRatePlanDto } from './dto/update-rate-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RatePlan } from './entities/rate-plan.entity';
import { Repository } from 'typeorm';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { CancellationPolicy } from 'src/cancellation-policies/entities/cancellation-policy.entity';
import { ListRatePlansDto } from './dto/list-rate-plans.dto';

@Injectable()
export class RatePlansService {
 constructor(
    @InjectRepository(RatePlan)
    private readonly repo: Repository<RatePlan>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
    @InjectRepository(CancellationPolicy)
    private readonly policyRepo: Repository<CancellationPolicy>,
  ) {}

  private async ensureRoomType(hotel_id: string, room_type_id: string) {
    const rt = await this.roomTypeRepo.findOne({ where: { id: room_type_id } });
    if (!rt) throw new NotFoundException(`RoomType ${room_type_id} not found`);
    if (rt.hotel_id !== hotel_id) {
      throw new BadRequestException('room_type_id must belong to hotel_id');
    }
    return rt;
  }

  private async ensureCancellationPolicy(hotel_id: string, policy_id?: string | null) {
    if (!policy_id) return;
    const policy = await this.policyRepo.findOne({ where: { id: policy_id } });
    if (!policy) throw new NotFoundException(`CancellationPolicy ${policy_id} not found`);
    if (policy.hotel_id !== hotel_id) {
      throw new BadRequestException('cancellation_policy_id does not belong to hotel_id');
    }
  }

  private validateOccupancy(base: number, max: number, roomTypeMax?: number) {
    if (base > max) {
      throw new BadRequestException('base_occupancy must be <= max_occupancy');
    }
    if (roomTypeMax !== undefined && max > roomTypeMax) {
      throw new BadRequestException('max_occupancy cannot exceed room type max_occupancy');
    }
  }

  private validateLos(min_los?: number, max_los?: number) {
    if (min_los && max_los && min_los > max_los) {
      throw new BadRequestException('min_los must be <= max_los');
    }
  }

  private toDecimal(v: number | undefined, defaultValue = 0): string {
    return (v !== undefined ? v : defaultValue).toFixed(2);
    }

  async create(dto: CreateRatePlanDto): Promise<RatePlan> {
    const rt = await this.ensureRoomType(dto.hotel_id, dto.room_type_id);
    await this.ensureCancellationPolicy(dto.hotel_id, dto.cancellation_policy_id ?? null);
    this.validateOccupancy(dto.base_occupancy, dto.max_occupancy, rt.max_occupancy);
    this.validateLos(dto.min_los, dto.max_los);

    const entity = this.repo.create({
      hotel_id: dto.hotel_id,
      room_type_id: dto.room_type_id,
      name: dto.name,
      description: dto.description ?? null,
      meal_plan: dto.meal_plan ?? null,
      type: dto.type,
      base_occupancy: dto.base_occupancy,
      max_occupancy: dto.max_occupancy,
      extra_adult_fee: this.toDecimal(dto.extra_adult_fee, 0),
      extra_child_fee: this.toDecimal(dto.extra_child_fee, 0),
      cancellation_policy_id: dto.cancellation_policy_id ?? null,
      prepayment_required: dto.prepayment_required ?? false,
      min_los: dto.min_los ?? null,
      max_los: dto.max_los ?? null,
      is_active: dto.is_active ?? true,
    });

    return this.repo.save(entity);
  }

  async findAll(query: ListRatePlansDto) {
    const {
      hotel_id,
      room_type_id,
      cancellation_policy_id,
      meal_plan,
      type,
      is_active,
      q,
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      order = 'DESC',
    } = query;

    const qb = this.repo.createQueryBuilder('rp');

    if (hotel_id) qb.andWhere('rp.hotel_id = :hotel_id', { hotel_id });
    if (room_type_id) qb.andWhere('rp.room_type_id = :room_type_id', { room_type_id });
    if (cancellation_policy_id) qb.andWhere('rp.cancellation_policy_id = :cpid', { cpid: cancellation_policy_id });
    if (meal_plan) qb.andWhere('rp.meal_plan = :meal_plan', { meal_plan });
    if (type) qb.andWhere('rp.type = :type', { type });
    if (typeof is_active === 'boolean') qb.andWhere('rp.is_active = :is_active', { is_active });
    if (q) qb.andWhere('(rp.name LIKE :q OR rp.description LIKE :q)', { q: `%${q}%` });

    qb.orderBy(`rp.${orderBy}`, order as 'ASC' | 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<RatePlan> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`RatePlan ${id} not found`);
    return found;
  }

  async update(id: string, dto: UpdateRatePlanDto): Promise<RatePlan> {
    const entity = await this.findOne(id);

    const hotel_id = dto.hotel_id ?? entity.hotel_id;
    const room_type_id = dto.room_type_id ?? entity.room_type_id;

    let rt: RoomType | undefined;
    if (dto.room_type_id || dto.hotel_id) {
      rt = await this.ensureRoomType(hotel_id, room_type_id);
    } else {
      rt = await this.roomTypeRepo.findOne({ where: { id: entity.room_type_id } });
    }

    if (dto.cancellation_policy_id !== undefined || dto.hotel_id !== undefined) {
      await this.ensureCancellationPolicy(hotel_id, dto.cancellation_policy_id ?? entity.cancellation_policy_id ?? null);
    }

    const base_occ = dto.base_occupancy ?? entity.base_occupancy;
    const max_occ = dto.max_occupancy ?? entity.max_occupancy;
    this.validateOccupancy(base_occ, max_occ, rt?.max_occupancy);

    const min_los = dto.min_los !== undefined ? dto.min_los : entity.min_los ?? undefined;
    const max_los = dto.max_los !== undefined ? dto.max_los : entity.max_los ?? undefined;
    this.validateLos(min_los, max_los);

    Object.assign(entity, {
      hotel_id,
      room_type_id,
      name: dto.name ?? entity.name,
      description: dto.description !== undefined ? dto.description : entity.description,
      meal_plan: dto.meal_plan !== undefined ? dto.meal_plan : entity.meal_plan,
      type: dto.type !== undefined ? dto.type : entity.type,
      base_occupancy: base_occ,
      max_occupancy: max_occ,
      extra_adult_fee:
        dto.extra_adult_fee !== undefined
          ? this.toDecimal(dto.extra_adult_fee, 0)
          : entity.extra_adult_fee,
      extra_child_fee:
        dto.extra_child_fee !== undefined
          ? this.toDecimal(dto.extra_child_fee, 0)
          : entity.extra_child_fee,
      cancellation_policy_id:
        dto.cancellation_policy_id !== undefined
          ? dto.cancellation_policy_id
          : entity.cancellation_policy_id,
      prepayment_required:
        dto.prepayment_required !== undefined
          ? dto.prepayment_required
          : entity.prepayment_required,
      min_los: dto.min_los !== undefined ? dto.min_los : entity.min_los,
      max_los: dto.max_los !== undefined ? dto.max_los : entity.max_los,
      is_active: dto.is_active !== undefined ? dto.is_active : entity.is_active,
    });

    return this.repo.save(entity);
  }

  async deactivate(id: string): Promise<RatePlan> {
    const entity = await this.findOne(id);
    if (!entity.is_active) return entity;
    entity.is_active = false;
    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException(`RatePlan ${id} not found`);
  }
}
