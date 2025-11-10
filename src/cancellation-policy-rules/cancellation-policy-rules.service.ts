import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCancellationPolicyRuleDto } from './dto/create-cancellation-policy-rule.dto';
import { UpdateCancellationPolicyRuleDto } from './dto/update-cancellation-policy-rule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CancellationPolicyRule } from './entities/cancellation-policy-rule.entity';
import { Not, Repository } from 'typeorm';
import { CancellationPolicy, PenaltyType } from 'src/cancellation-policies/entities/cancellation-policy.entity';
import { ListCancellationPolicyRulesDto } from './dto/list-cancellation-policy-rules.dto';

@Injectable()
export class CancellationPolicyRulesService {
 constructor(
    @InjectRepository(CancellationPolicyRule)
    private readonly repo: Repository<CancellationPolicyRule>,
    @InjectRepository(CancellationPolicy)
    private readonly policyRepo: Repository<CancellationPolicy>,
  ) {}

  private async ensurePolicyExists(policy_id: string) {
    const exists = await this.policyRepo.exist({ where: { id: policy_id } });
    if (!exists) throw new NotFoundException(`CancellationPolicy ${policy_id} not found`);
  }

  private validatePenalty(type: PenaltyType, value: number) {
    if (value < 0) {
      throw new BadRequestException('penalty_value must be >= 0');
    }
    if (type === PenaltyType.PERCENT && (value > 100 || value < 0)) {
      throw new BadRequestException('penalty_value must be between 0 and 100 for PERCENT');
    }
    if (type === PenaltyType.NIGHTS && !Number.isInteger(value)) {
      throw new BadRequestException('penalty_value must be an integer for NIGHTS');
    }
  }

  private formatValue(value: number): string {
    return value.toFixed(2);
  }

  async create(dto: CreateCancellationPolicyRuleDto): Promise<CancellationPolicyRule> {
    await this.ensurePolicyExists(dto.policy_id);
    this.validatePenalty(dto.penalty_type, dto.penalty_value);

    // Unique constraint check (policy_id, days_before_checkin)
    const conflict = await this.repo.findOne({
      where: {
        policy_id: dto.policy_id,
        days_before_checkin: dto.days_before_checkin,
      },
    });
    if (conflict) {
      throw new ConflictException('Rule with same days_before_checkin already exists for this policy');
    }

    const entity = this.repo.create({
      policy_id: dto.policy_id,
      days_before_checkin: dto.days_before_checkin,
      penalty_type: dto.penalty_type,
      penalty_value: this.formatValue(dto.penalty_value),
    });
    return this.repo.save(entity);
  }

  async findAll(query: ListCancellationPolicyRulesDto) {
    const {
      policy_id,
      penalty_type,
      days_from,
      days_to,
      page = 1,
      limit = 50,
      orderBy = 'days_before_checkin',
      order = 'ASC',
    } = query;

    const qb = this.repo.createQueryBuilder('r');

    if (policy_id) qb.andWhere('r.policy_id = :policy_id', { policy_id });
    if (penalty_type) qb.andWhere('r.penalty_type = :penalty_type', { penalty_type });
    if (days_from !== undefined) qb.andWhere('r.days_before_checkin >= :days_from', { days_from });
    if (days_to !== undefined) qb.andWhere('r.days_before_checkin <= :days_to', { days_to });

    qb.orderBy(`r.${orderBy}`, order as 'ASC' | 'DESC');

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

  async findOne(id: string): Promise<CancellationPolicyRule> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`CancellationPolicyRule ${id} not found`);
    return found;
  }

  async update(id: string, dto: UpdateCancellationPolicyRuleDto): Promise<CancellationPolicyRule> {
    const entity = await this.findOne(id);

    let policy_id = entity.policy_id;
    if (dto.policy_id && dto.policy_id !== entity.policy_id) {
      await this.ensurePolicyExists(dto.policy_id);
      policy_id = dto.policy_id;
    }

    const days_before_checkin =
      dto.days_before_checkin !== undefined ? dto.days_before_checkin : entity.days_before_checkin;

    const penalty_type =
      dto.penalty_type !== undefined ? dto.penalty_type : entity.penalty_type;

    const penalty_value_number =
      dto.penalty_value !== undefined ? dto.penalty_value : parseFloat(entity.penalty_value);

    this.validatePenalty(penalty_type, penalty_value_number);

    // Unique constraint check if (policy_id or days_before_checkin) changed
    if (policy_id !== entity.policy_id || days_before_checkin !== entity.days_before_checkin) {
      const conflict = await this.repo.findOne({
        where: {
          policy_id,
          days_before_checkin,
          id: Not(id),
        },
      });
      if (conflict) {
        throw new ConflictException('Another rule with same days_before_checkin exists for this policy');
      }
    }

    entity.policy_id = policy_id;
    entity.days_before_checkin = days_before_checkin;
    entity.penalty_type = penalty_type;
    entity.penalty_value = this.formatValue(penalty_value_number);

    return this.repo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException(`CancellationPolicyRule ${id} not found`);
  }

  // Optional helper: list rules for a policy ordered ascending and normalized
  async getPolicyRules(policy_id: string): Promise<CancellationPolicyRule[]> {
    await this.ensurePolicyExists(policy_id);
    return this.repo.find({
      where: { policy_id },
      order: { days_before_checkin: 'ASC' },
    });
  }
}
