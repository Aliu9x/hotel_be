import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTemporaryLockDto } from './dto/create-temporary-lock.dto';
import { UpdateTemporaryLockDto } from './dto/update-temporary-lock.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TemporaryLock } from './entities/temporary-lock.entity';
import { Repository } from 'typeorm';
import { RoomType } from 'src/room-types/entities/room-type.entity';

@Injectable()
export class TemporaryLocksService {
   constructor(
    @InjectRepository(TemporaryLock)
    private readonly repo: Repository<TemporaryLock>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
  ) {}

  private ensureDateRangeValid(start_date: string, end_date: string) {
    const s = new Date(start_date);
    const e = new Date(end_date);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      throw new BadRequestException('Invalid start_date or end_date');
    }
    if (s > e) {
      throw new BadRequestException('start_date must be <= end_date');
    }
  }

  private async ensureRoomTypeBelongsToHotel(room_type_id?: string | null, hotel_id?: string) {
    if (!room_type_id) return;
    const rt = await this.roomTypeRepo.findOne({ where: { id: room_type_id } });
    if (!rt) throw new NotFoundException(`RoomType ${room_type_id} not found`);
    if (hotel_id && rt.hotel_id !== hotel_id) {
      throw new BadRequestException('room_type_id does not belong to the provided hotel_id');
    }
  }

  private async assertNoOverlap(params: {
    idToExclude?: string;
    hotel_id: string;
    room_type_id?: string | null;
    start_date: string;
    end_date: string;
  }) {
    const { idToExclude, hotel_id, room_type_id, start_date, end_date } = params;
    const qb = this.repo.createQueryBuilder('l')
      .where('l.hotel_id = :hotel_id', { hotel_id })
      .andWhere('l.start_date <= :end_date AND l.end_date >= :start_date', {
        start_date,
        end_date,
      });

    if (room_type_id == null) {
      qb.andWhere('l.room_type_id IS NULL');
    } else {
      qb.andWhere('l.room_type_id = :room_type_id', { room_type_id });
    }

    if (idToExclude) {
      qb.andWhere('l.id <> :idToExclude', { idToExclude });
    }

    const overlap = await qb.getOne();
    if (overlap) {
      throw new ConflictException('Overlapping lock exists for the same scope (hotel_id + room_type_id).');
    }
  }

  async create(dto: CreateTemporaryLockDto): Promise<TemporaryLock> {
    this.ensureDateRangeValid(dto.start_date, dto.end_date);
    await this.ensureRoomTypeBelongsToHotel(dto.room_type_id ?? null, dto.hotel_id);
    await this.assertNoOverlap({
      hotel_id: dto.hotel_id,
      room_type_id: dto.room_type_id ?? null,
      start_date: dto.start_date,
      end_date: dto.end_date,
    });

    const entity = this.repo.create({
      hotel_id: dto.hotel_id,
      room_type_id: dto.room_type_id ?? null,
      start_date: dto.start_date,
      end_date: dto.end_date,
      note: dto.note ?? null,
    });
    return this.repo.save(entity);
  }

  async update(id: string, dto: UpdateTemporaryLockDto): Promise<TemporaryLock> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`TemporaryLock ${id} not found`);

    const next = { ...entity, ...dto };

    await this.ensureRoomTypeBelongsToHotel(next.room_type_id ?? null, next.hotel_id);
    this.ensureDateRangeValid(next.start_date, next.end_date);

    await this.assertNoOverlap({
      idToExclude: id,
      hotel_id: next.hotel_id,
      room_type_id: next.room_type_id ?? null,
      start_date: next.start_date,
      end_date: next.end_date,
    });

    Object.assign(entity, next);
    return this.repo.save(entity);
  }
}
