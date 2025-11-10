import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCancellationPolicyDto } from './dto/create-cancellation-policy.dto';
import { UpdateCancellationPolicyDto } from './dto/update-cancellation-policy.dto';
import { CancellationPolicy, PenaltyType } from './entities/cancellation-policy.entity';
import { ListCancellationPoliciesDto } from './dto/list-cancellation-policies.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CancellationPoliciesService {
 constructor(
    @InjectRepository(CancellationPolicy)
    private readonly repo: Repository<CancellationPolicy>,
  ) {}

  private normalizePenaltyValue(
    type: PenaltyType,
    value?: number,
  ): string | undefined {
    if (value === undefined || value === null) return undefined;

    // Validation rules based on type (MySQL-friendly numbers)
    if (type === PenaltyType.PERCENT) {
      if (value < 0 || value > 100) {
        throw new BadRequestException('no_show_penalty_value must be between 0 and 100 for PERCENT');
      }
    } else if (type === PenaltyType.NIGHTS) {
      if (!Number.isInteger(value) || value < 0) {
        throw new BadRequestException('no_show_penalty_value must be a non-negative integer for NIGHTS');
      }
    } else if (type === PenaltyType.AMOUNT) {
      if (value < 0) {
        throw new BadRequestException('no_show_penalty_value must be >= 0 for AMOUNT');
      }
    }
    // Store as string with 2 decimals for decimal(12,2)
    return value.toFixed(2);
  }

  async create(dto: CreateCancellationPolicyDto): Promise<CancellationPolicy> {
    const type = dto.no_show_penalty_type ?? PenaltyType.PERCENT;
    const valueString =
      this.normalizePenaltyValue(type, dto.no_show_penalty_value ?? (type === PenaltyType.PERCENT ? 100 : 0)) ??
      undefined;

    const entity = this.repo.create({
      hotel_id: dto.hotel_id,
      name: dto.name,
      description: dto.description ?? null,
      no_show_penalty_type: type,
      no_show_penalty_value: valueString ?? (type === PenaltyType.PERCENT ? '100.00' : '0.00'),
    });
    return this.repo.save(entity);
  }

  async findAll(query: ListCancellationPoliciesDto) {
    const {
      hotel_id,
      q,
      no_show_penalty_type,
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      order = 'DESC',
    } = query;

    const qb = this.repo.createQueryBuilder('cp');

    if (hotel_id) qb.andWhere('cp.hotel_id = :hotel_id', { hotel_id });
    if (q) qb.andWhere('(cp.name LIKE :q OR cp.description LIKE :q)', { q: `%${q}%` }); // MySQL LIKE
    if (no_show_penalty_type) qb.andWhere('cp.no_show_penalty_type = :t', { t: no_show_penalty_type });

    qb.orderBy(`cp.${orderBy}`, order as 'ASC' | 'DESC');

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

  async findOne(id: string): Promise<CancellationPolicy> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`CancellationPolicy ${id} not found`);
    return found;
  }

  async update(id: string, dto: UpdateCancellationPolicyDto): Promise<CancellationPolicy> {
    const entity = await this.findOne(id);

    const type =
      dto.no_show_penalty_type !== undefined ? dto.no_show_penalty_type : entity.no_show_penalty_type;

    const nextValue =
      dto.no_show_penalty_value !== undefined
        ? this.normalizePenaltyValue(type, dto.no_show_penalty_value)
        : undefined;

    Object.assign(entity, {
      ...dto,
      no_show_penalty_type: type,
      no_show_penalty_value:
        nextValue !== undefined ? nextValue : entity.no_show_penalty_value,
      description: dto.description !== undefined ? dto.description : entity.description,
      name: dto.name !== undefined ? dto.name : entity.name,
    });

    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException(`CancellationPolicy ${id} not found`);
  }
}
