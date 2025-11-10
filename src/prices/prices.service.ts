import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePriceDto } from './dto/create-price.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Price } from './entities/price.entity';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { ListPricesDto } from './dto/list-prices.dto';

@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(Price)
    private readonly repo: Repository<Price>,
    @InjectRepository(RatePlan)
    private readonly ratePlanRepo: Repository<RatePlan>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
  ) {}

  private async ensureRelations(hotel_id: string, room_type_id: string, rate_plan_id: string) {
    const rp = await this.ratePlanRepo.findOne({ where: { id: rate_plan_id } });
    if (!rp) throw new NotFoundException(`RatePlan ${rate_plan_id} not found`);
    if (rp.hotel_id !== hotel_id || rp.room_type_id !== room_type_id) {
      throw new BadRequestException('RatePlan does not belong to provided hotel_id / room_type_id');
    }
    const rt = await this.roomTypeRepo.findOne({ where: { id: room_type_id } });
    if (!rt) throw new NotFoundException(`RoomType ${room_type_id} not found`);
    if (rt.hotel_id !== hotel_id) {
      throw new BadRequestException('RoomType does not belong to provided hotel_id');
    }
  }

  private toDecimal(value: number): string {
    return value.toFixed(2);
  }

  async create(dto: CreatePriceDto): Promise<Price> {
    await this.ensureRelations(dto.hotel_id, dto.room_type_id, dto.rate_plan_id);

    // Upsert by (rate_plan_id, date)
    const existing = await this.repo.findOne({
      where: {
        rate_plan_id: dto.rate_plan_id,
        date: dto.date,
      },
    });

    if (existing) {
      existing.hotel_id = dto.hotel_id;
      existing.room_type_id = dto.room_type_id;
      existing.price_amount = this.toDecimal(dto.price_amount);
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      hotel_id: dto.hotel_id,
      room_type_id: dto.room_type_id,
      rate_plan_id: dto.rate_plan_id,
      date: dto.date,
      price_amount: this.toDecimal(dto.price_amount),
    });
    return this.repo.save(entity);
  }

  async findAll(query: ListPricesDto) {
    const {
      hotel_id,
      room_type_id,
      rate_plan_id,
      date,
      date_from,
      date_to,
      q,
      page = 1,
      limit = 100,
      orderBy = 'date',
      order = 'ASC',
    } = query;

    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.rate_plan', 'rp');

    if (hotel_id) qb.andWhere('p.hotel_id = :hotel_id', { hotel_id });
    if (room_type_id) qb.andWhere('p.room_type_id = :room_type_id', { room_type_id });
    if (rate_plan_id) qb.andWhere('p.rate_plan_id = :rate_plan_id', { rate_plan_id });
    if (date) qb.andWhere('p.date = :date', { date });
    if (date_from) qb.andWhere('p.date >= :date_from', { date_from });
    if (date_to) qb.andWhere('p.date <= :date_to', { date_to });
    if (q) qb.andWhere('rp.name LIKE :q', { q: `%${q}%` });

    qb.orderBy(`p.${orderBy}`, order as 'ASC' | 'DESC');
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

  async findOne(id: string): Promise<Price> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException(`Price ${id} not found`);
    return found;
  }
async update(id: string, dto: UpdatePriceDto): Promise<Price> {
  const entity = await this.findOne(id); // sẽ ném NotFound nếu ko tìm

  const hotel_id = dto.hotel_id ?? entity.hotel_id;
  const room_type_id = dto.room_type_id ?? entity.room_type_id;
  const rate_plan_id = dto.rate_plan_id ?? entity.rate_plan_id;

  // nếu có thay đổi quan hệ -> kiểm tra xem các relation hợp lệ
  if (
    dto.hotel_id !== undefined ||
    dto.room_type_id !== undefined ||
    dto.rate_plan_id !== undefined
  ) {
    await this.ensureRelations(hotel_id, room_type_id, rate_plan_id);
  }

  // validate date (nếu truyền)
  const newDate = dto.date ?? entity.date;
  if (Number.isNaN(new Date(newDate).getTime())) {
    throw new BadRequestException('Invalid date');
  }

  // nếu thay đổi rate_plan_id hoặc date, cần kiểm tra unique(rate_plan_id, date)
  const newRatePlanId = rate_plan_id;
  const newDateOnly = newDate; // ensure yyyy-mm-dd
  if (newRatePlanId !== entity.rate_plan_id || newDateOnly !== entity.date) {
    const exists = await this.repo.findOne({
      where: {
        rate_plan_id: newRatePlanId,
        date: newDateOnly,
      },
    });
    if (exists && exists.id !== entity.id) {
      throw new ConflictException('Price for this rate_plan and date already exists');
    }
  }

  Object.assign(entity, {
    hotel_id,
    room_type_id,
    rate_plan_id,
    date: newDateOnly,
    price_amount:
      dto.price_amount !== undefined
        ? this.toDecimal(dto.price_amount)
        : entity.price_amount,
    updated_at: new Date(),
  });

  try {
    return await this.repo.save(entity);
  } catch (err) {
    // catch DB unique error as conflict
    if (this.isUniqueConstraintViolation(err)) {
      throw new ConflictException('Duplicate price (rate_plan_id + date)');
    }
    throw err;
  }
}

async remove(id: string): Promise<void> {
  const res = await this.repo.delete(id);
  if (!res.affected) throw new NotFoundException(`Price ${id} not found`);
}

// bulk upsert - using TypeORM upsert (v0.3+). Adjust if your TypeORM version different.
async bulkUpsert(items: CreatePriceDto[]): Promise<Price[]> {
  if (items.length === 0) return [];

  // map items -> entities
  const entities = items.map(item => this.repo.create({
    hotel_id: item.hotel_id,
    room_type_id: item.room_type_id,
    rate_plan_id: item.rate_plan_id,
    date: item.date,
    price_amount: this.toDecimal(item.price_amount),
    updated_at: new Date(),
    created_at: new Date(),
  }));

  // upsert on conflict (postgres) by rate_plan_id + date
  await this.repo.upsert(
    entities,
    ['rate_plan_id', 'date'] // conflict target; adjust if your DB has composite unique (rate_plan_id,date)
  );

  // return saved rows (re-fetch)
  const ratePlanIds = Array.from(new Set(items.map(i => i.rate_plan_id)));
  const dates = Array.from(new Set(items.map(i => i.date)));
  return this.repo.find({
    where: { rate_plan_id: In(ratePlanIds), date: In(dates) }
  });
}

// helper to detect unique violation (Postgres example)
private isUniqueConstraintViolation(err: any): boolean {
  return err && (err.code === '23505' || err.code === 'SQLITE_CONSTRAINT'); // pg, sqlite
}

}
