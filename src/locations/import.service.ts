import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Ward } from './entities/ward.entity';
import { normHeader, toAscii, toSlug } from './utils/text-normalizer';
import * as XLSX from 'xlsx';

type Row = Record<string, any>;

function padCode(raw: any, len: number): string {
  if (raw === null || raw === undefined) return '';
  let s = String(raw).trim();
  if (/^\d+$/.test(s)) s = s.padStart(len, '0');
  return s;
}

const DETAIL_LOG = process.env.IMPORT_LOG_DETAILS === '1';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
    @InjectRepository(Ward) private readonly wardRepo: Repository<Ward>,
  ) {}

  /* ---------------- Common Helpers ---------------- */

  private readSheet(buf: Buffer): Row[] {
    try {
      const wb = XLSX.read(buf, {
        type: 'buffer',
      });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
        defval: '',
      });
      if (!rows.length) throw new Error('Empty sheet');
      return rows;
    } catch (e) {
      throw new BadRequestException(`Invalid XLSX: ${(e as Error).message}`);
    }
  }

  private mapProvince(r: Row, idx: number) {
    const out: any = {};
    for (const [k, v] of Object.entries(r)) {
      const nk = normHeader(k);
      if (['matinh', 'matinhtp', 'code', 'provincecode'].includes(nk))
        out.code = padCode(v, 2);
      else if (['ten', 'name'].includes(nk)) out.name = String(v).trim();
      else if (['loai', 'type'].includes(nk)) out.type = String(v).trim();
    }
    if (!out.code || !out.name)
      throw new Error(`Row ${idx + 2}: missing code/name`);
    return out;
  }

  private mapDistrict(r: Row, idx: number) {
    const out: any = {};
    for (const [k, v] of Object.entries(r)) {
      const nk = normHeader(k);
      if (['mahuyen', 'mahuyentpthixa', 'code', 'districtcode'].includes(nk))
        out.code = padCode(v, 3);
      else if (['ten', 'name'].includes(nk)) out.name = String(v).trim();
      else if (['loai', 'type'].includes(nk)) out.type = String(v).trim();
      else if (['matinh', 'matinhtp', 'provincecode'].includes(nk))
        out.province_code = padCode(v, 2);
    }
    if (!out.code || !out.name || !out.province_code)
      throw new Error(`Row ${idx + 2}: missing code/name/province_code`);
    return out;
  }

  private mapWard(r: Row, idx: number) {
    this.logger.debug(
      `[WARD MAP] Row ${idx + 2} keys: ${Object.keys(r).join(' | ')}`,
    );
    const out: any = {};
    const HEADER_MAP: Record<string, string> = {
      maxa: 'code',
      maxaphuong: 'code',
      maxaphuongthitran: 'code',
      code: 'code',
      wardcode: 'code',
      ten: 'name',
      name: 'name',
      loai: 'type',
      type: 'type',
      mahuyen: 'district_code',
      districtcode: 'district_code',
      mahuyentp: 'district_code',
      mahuyentpthixa: 'district_code',
      mahuyentpthitran: 'district_code',
    };

    for (const [k, v] of Object.entries(r)) {
      const nk = normHeader(k);
      const field = HEADER_MAP[nk];
      if (!field) continue;
      if (field === 'code') out.code = padCode(v, 5);
      else if (field === 'district_code') out.district_code = padCode(v, 3);
      else if (field === 'name') out.name = String(v).trim();
      else if (field === 'type') out.type = String(v).trim();
    }

    if (!out.code || !out.name || !out.district_code) {
      this.logger.error(
        `[WARD MAP ERROR] row=${idx + 2} raw=${JSON.stringify(r)} parsed=${JSON.stringify(out)}`,
      );
      throw new Error(`Row ${idx + 2}: missing code/name/district_code`);
    }
    return out;
  }

  private logSample(label: string, list: any[]) {
    if (!list.length) {
      this.logger.warn(`${label}: (empty)`);
      return;
    }
    const sample = list.slice(0, 5);
    this.logger.debug(
      `${label} sample[0..${sample.length - 1}]: ${JSON.stringify(sample)}`,
    );
    if (DETAIL_LOG && list.length > 5) {
      this.logger.debug(`${label} total=${list.length}`);
    }
  }

  /* ---------------- Province Import ---------------- */

  async importProvinces(file: Express.Multer.File) {
    const t0 = Date.now();
    const rows = this.readSheet(file.buffer);
    this.logger.log(`Import provinces: raw rows=${rows.length}`);

    let mapped: any[] = [];
    try {
      mapped = rows.map((r, i) => this.mapProvince(r, i));
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    this.logSample('Mapped provinces', mapped);

    const codes = mapped.map((m) => m.code);
    // Fetch existing
    const existing = await this.provinceRepo.find({
      where: {
        code: In(codes),
      },
      select: ['id', 'code'],
    });
    const existingMap = new Map(existing.map((e) => [e.code, e.id]));

    const insertList: any[] = [];
    const updateList: any[] = [];

    for (const r of mapped) {
      const base = {
        code: r.code,
        name: r.name,
        name_ascii: toAscii(r.name),
        slug: toSlug(r.name),
        type: r.type || 'Tỉnh',
        full_name: r.name,
        status: 'active',
      };
      if (existingMap.has(r.code)) updateList.push(base);
      else insertList.push(base);
    }

    this.logger.log(
      `Province split => insert=${insertList.length}, update=${updateList.length}`,
    );

    await this.ds.transaction(async (trx) => {
      const repo = trx.getRepository(Province);

      // Bulk insert
      if (insertList.length) {
        await repo
          .createQueryBuilder()
          .insert()
          .into(Province)
          .values(insertList)
          .execute();
      }

      // Batch update (per code)
      for (const u of updateList) {
        await repo.update(
          {
            code: u.code,
          },
          {
            name: u.name,
            name_ascii: u.name_ascii,
            slug: u.slug,
            type: u.type,
            full_name: u.full_name,
            status: 'active',
          },
        );
      }
    });

    const dt = Date.now() - t0;
    this.logger.log(`Import provinces done in ${dt}ms`);
    return {
      count: mapped.length,
      inserted: insertList.length,
      updated: updateList.length,
      ms: dt,
    };
  }

  /* ---------------- District Import ---------------- */

  async importDistricts(file: Express.Multer.File) {
    const t0 = Date.now();
    const rows = this.readSheet(file.buffer);
    this.logger.log(`Import districts: raw rows=${rows.length}`);

    let mapped: any[] = [];
    try {
      mapped = rows.map((r, i) => this.mapDistrict(r, i));
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    this.logSample('Mapped districts', mapped);

    const provinceCodes = [...new Set(mapped.map((m) => m.province_code))];
    this.logger.debug(
      `Unique province codes referenced: ${provinceCodes.length}`,
    );

    const parents = await this.provinceRepo.find({
      where: {
        code: In(provinceCodes),
      },
      select: ['id', 'code'],
    });
    const pMap = new Map(parents.map((p) => [p.code, p.id]));
    const missingParents = provinceCodes.filter((c) => !pMap.has(c));
    if (missingParents.length) {
      this.logger.error(`Missing province codes: ${missingParents.join(', ')}`);
      throw new BadRequestException(
        `Missing provinces: ${missingParents.join(', ')}`,
      );
    }

    const codes = mapped.map((m) => m.code);
    const existing = await this.districtRepo.find({
      where: {
        code: In(codes),
      },
      select: ['id', 'code'],
    });
    const existingMap = new Map(existing.map((e) => [e.code, e.id]));

    const insertList: any[] = [];
    const updateList: any[] = [];

    for (const r of mapped) {
      const pid = pMap.get(r.province_code);
      if (!pid) {
        this.logger.warn(
          `Skip district code=${r.code} (province ${r.province_code} not found)`,
        );
        continue;
      }
      const base = {
        code: r.code,
        name: r.name,
        name_ascii: toAscii(r.name),
        slug: toSlug(r.name),
        type: r.type || 'Quận',
        full_name: r.name,
        status: 'active',
        province_id: pid,
      };
      if (existingMap.has(r.code)) updateList.push(base);
      else insertList.push(base);
    }

    this.logger.log(
      `District split => insert=${insertList.length}, update=${updateList.length}`,
    );

    await this.ds.transaction(async (trx) => {
      const repo = trx.getRepository(District);

      if (insertList.length) {
        await repo
          .createQueryBuilder()
          .insert()
          .into(District)
          .values(insertList)
          .execute();
      }

      for (const u of updateList) {
        await repo.update(
          {
            code: u.code,
          },
          {
            name: u.name,
            name_ascii: u.name_ascii,
            slug: u.slug,
            type: u.type,
            full_name: u.full_name,
            status: 'active',
            province_id: u.province_id,
          },
        );
      }
    });

    const dt = Date.now() - t0;
    this.logger.log(`Import districts done in ${dt}ms`);
    return {
      count: mapped.length,
      inserted: insertList.length,
      updated: updateList.length,
      ms: dt,
    };
  }

  /* ---------------- Ward Import ---------------- */

  async importWards(file: Express.Multer.File) {
    const t0 = Date.now();
    const rows = this.readSheet(file.buffer);
    this.logger.log(`Import wards: raw rows=${rows.length}`);

    let mapped: any[] = [];
    try {
      mapped = rows.map((r, i) => this.mapWard(r, i));
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    this.logSample('Mapped wards', mapped);

    const districtCodes = [...new Set(mapped.map((m) => m.district_code))];
    this.logger.debug(
      `Unique district codes referenced: ${districtCodes.length}`,
    );

    const parents = await this.districtRepo.find({
      where: {
        code: In(districtCodes),
      },
      select: ['id', 'code'],
    });
    const dMap = new Map(parents.map((d) => [d.code, d.id]));
    const missingParents = districtCodes.filter((c) => !dMap.has(c));
    if (missingParents.length) {
      this.logger.error(`Missing district codes: ${missingParents.join(', ')}`);
      throw new BadRequestException(
        `Missing districts: ${missingParents.join(', ')}`,
      );
    }

    const codes = mapped.map((m) => m.code);
    const existing = await this.wardRepo.find({
      where: {
        code: In(codes),
      },
      select: ['id', 'code'],
    });
    const existingMap = new Map(existing.map((e) => [e.code, e.id]));

    const insertList: any[] = [];
    const updateList: any[] = [];

    for (const r of mapped) {
      const did = dMap.get(r.district_code);
      if (!did) {
        this.logger.warn(
          `Skip ward code=${r.code} (district ${r.district_code} not found)`,
        );
        continue;
      }
      const base = {
        code: r.code,
        name: r.name,
        name_ascii: toAscii(r.name),
        slug: toSlug(r.name),
        type: r.type || 'Phường',
        full_name: r.name,
        status: 'active',
        district_id: did,
      };
      if (existingMap.has(r.code)) updateList.push(base);
      else insertList.push(base);
    }

    this.logger.log(
      `Ward split => insert=${insertList.length}, update=${updateList.length}`,
    );

    await this.ds.transaction(async (trx) => {
      const repo = trx.getRepository(Ward);

      if (insertList.length) {
        await repo
          .createQueryBuilder()
          .insert()
          .into(Ward)
          .values(insertList)
          .execute();
      }

      for (const u of updateList) {
        await repo.update(
          {
            code: u.code,
          },
          {
            name: u.name,
            name_ascii: u.name_ascii,
            slug: u.slug,
            type: u.type,
            full_name: u.full_name,
            status: 'active',
            district_id: u.district_id,
          },
        );
      }
    });

    const dt = Date.now() - t0;
    this.logger.log(`Import wards done in ${dt}ms`);
    return {
      count: mapped.length,
      inserted: insertList.length,
      updated: updateList.length,
      ms: dt,
    };
  }
}
