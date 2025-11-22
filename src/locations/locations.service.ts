import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Ward } from './entities/ward.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from './dto/query.dto';
import { toAscii } from './utils/text-normalizer';
import { PaginateResult } from './dto/response.dto';


async function paginate<T>(
  qb: SelectQueryBuilder<T>,
  page = 1,
  limit = 20,
): Promise<PaginateResult<T>> {
  const offset = (page - 1) * limit;
  const [rows, total] = await qb.skip(offset).take(limit).getManyAndCount();
  const pages = Math.ceil(total / limit) || 1;
  return {
    meta: { page, limit, pages, total },
    result: rows,
  };
}
@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
    @InjectRepository(Ward) private readonly wardRepo: Repository<Ward>,
  ) {}

  async listProvinces(q: PaginationQueryDto) {
    const { page = 1, limit = 20, search } = q;
    const qb = this.provinceRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'active' })
      .orderBy('p.name_ascii', 'ASC');

    if (search) {
      const s = toAscii(search);
      qb.andWhere('(p.name_ascii LIKE :s OR p.code LIKE :raw)', {
        s: `%${s}%`,
        raw: `%${search}%`,
      });
    }

    return paginate(qb, page, limit);
  }

  async listDistricts(q: PaginationQueryDto) {
    const { page = 1, limit = 20, search, provinceId } = q;
    if (!provinceId) throw new NotFoundException('provinceId required');

    const qb = this.districtRepo
      .createQueryBuilder('d')
      .where('d.status = :status AND d.province_id = :pid', {
        status: 'active',
        pid: provinceId,
      })
      .orderBy('d.name_ascii', 'ASC');

    if (search) {
      const s = toAscii(search);
      qb.andWhere('(d.name_ascii LIKE :s OR d.code LIKE :raw)', {
        s: `%${s}%`,
        raw: `%${search}%`,
      });
    }

    return paginate(qb, page, limit);
  }

  async listWards(q: PaginationQueryDto) {
    const { page = 1, limit = 20, search, districtId } = q;
    if (!districtId) throw new NotFoundException('districtId required');

    const qb = this.wardRepo
      .createQueryBuilder('w')
      .where('w.status = :status AND w.district_id = :did', {
        status: 'active',
        did: districtId,
      })
      .orderBy('w.name_ascii', 'ASC');

    if (search) {
      const s = toAscii(search);
      qb.andWhere('(w.name_ascii LIKE :s OR w.code LIKE :raw)', {
        s: `%${s}%`,
        raw: `%${search}%`,
      });
    }

    return paginate(qb, page, limit);
  }

  async getProvinceOrFail(id: number) {
    const p = await this.provinceRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Province not found');
    return p;
  }

  async getDistrictOrFail(id: number) {
    const d = await this.districtRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('District not found');
    return d;
  }
}
