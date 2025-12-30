import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Province } from '../locations/entities/province.entity';
import { District } from '../locations/entities/district.entity';
import { Ward } from '../locations/entities/ward.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { vnAscii, buildHighlightParts } from './utils/highlight';
import {
  SuggestHierarchy,
  SuggestItem,
  SuggestQueryDto,
} from './dto/create-search.dto';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import {
  AvailabilityResponse,
  AvailabilitySearchDto,
  HotelAvailability,
  RoomTypeAvailability,
} from './dto/availability-search.dto';
import {
  HotelRoomTypeDaily,
  HotelRoomTypesQueryDto,
  HotelRoomTypesResponse,
  RatePlanPrice,
} from './dto/hotel-room-types.dto';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';
import { HotelsService } from 'src/hotels/hotels.service';
import { HotelPoliciesService } from 'src/hotel-policies/hotel-policies.service';
import { AmenityMappingsService } from 'src/amenity-mappings/amenity-mappings.service';

type TType = 'hotel' | 'province' | 'district' | 'ward';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
    @InjectRepository(Ward) private readonly wardRepo: Repository<Ward>,
    @InjectRepository(Hotel) private readonly hotelRepo: Repository<Hotel>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(RatePlan)
    private readonly ratePlanRepo: Repository<RatePlan>,

    private readonly hotelsService: HotelsService,
    private readonly hotelPoliciesService: HotelPoliciesService,
    private readonly amenityMappingsService: AmenityMappingsService,
  ) {}
  private meta(type: TType) {
    switch (type) {
      case 'hotel':
        return {
          badge: 'Khách sạn',
          badge_color: '#FF5E1F',
          category: 'Khách sạn',
        };
      case 'province':
        return {
          badge: 'Tỉnh/Thành',
          badge_color: '#0071f2',
          category: 'Tỉnh/Thành',
        };
      case 'district':
        return {
          badge: 'Quận/Huyện',
          category: 'Quận/Huyện',
        };
      case 'ward':
        return {
          badge: 'Phường/Xã',
          category: 'Phường/Xã',
        };
      default:
        return {
          badge: 'Địa điểm',
          category: 'Khác',
        };
    }
  }

  private parseTypes(raw?: string): TType[] {
    if (!raw) return ['hotel', 'province', 'district', 'ward'];
    const arr = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const set = new Set<TType>();
    for (const t of arr)
      if (['hotel', 'province', 'district', 'ward'].includes(t))
        set.add(t as TType);
    return Array.from(set).length
      ? Array.from(set)
      : ['hotel', 'province', 'district', 'ward'];
  }

  private buildItem(base: {
    type: TType;
    id: number | string;
    label: string;
    query: string;
    subtitle?: string;
    province?: Province;
    district?: District;
    ward?: Ward;
    hotel?: Hotel;
    province_id?: number;
    district_id?: number;
    ward_id?: number;
    hotel_id?: string | number;
  }): SuggestItem {
    const m = this.meta(base.type);
    const hierarchy: SuggestHierarchy = {};
    const path: string[] = [];

    if (base.hotel) {
      hierarchy.hotel = { id: base.hotel.id, name: base.hotel.name };
      path.push(base.hotel.name);
    }
    if (base.ward) {
      hierarchy.ward = {
        id: base.ward.id,
        name: base.ward.name,
        code: base.ward.code,
      };
      path.push(base.ward.name);
    }
    if (base.district) {
      hierarchy.district = {
        id: base.district.id,
        name: base.district.name,
        code: base.district.code,
      };
      path.push(base.district.name);
    }
    if (base.province) {
      hierarchy.province = {
        id: base.province.id,
        name: base.province.name,
        code: base.province.code,
      };
      path.push(base.province.name);
    }
    const path_string = path.join(' • ');
    return {
      type: base.type,
      category: m.category,
      id: base.id,
      label: base.label,
      label_parts: buildHighlightParts(base.label, base.query),
      subtitle: base.subtitle,
      badge: m.badge,
      badge_color: m.badge_color,
      province_id: base.province_id,
      district_id: base.district_id,
      ward_id: base.ward_id,
      hotel_id: base.hotel_id,
      hierarchy,
      full_path: path,
      path_string,
    };
  }
  buildAdminLabel(type?: string, name?: string) {
    return type && name ? `${type} ${name}` : null;
  }

  async suggest(dto: SuggestQueryDto): Promise<SuggestItem[]> {
    const { q, limit = 12, types } = dto;
    const query = q.trim();
    if (!query || query.length < 2) return [];
    const asciiQ = vnAscii(query);
    const typeList = this.parseTypes(types);
    const perGroup = Math.max(3, Math.floor(limit / typeList.length));
    const items: SuggestItem[] = [];
    if (typeList.includes('hotel')) {
      const hotels = await this.hotelRepo
        .createQueryBuilder('h')
        .where("h.approval_status = 'APPROVED'")
        .andWhere(
          '(h.name LIKE :raw OR h.address_line LIKE :raw OR h.province_name LIKE :raw OR h.district_name LIKE :raw OR h.ward_name LIKE :raw)',
          { raw: `%${query}%` },
        )
        .addSelect(
          `CASE WHEN h.name LIKE :prefix THEN 0 ELSE 1 END`,
          'h_priority',
        )
        .setParameters({ prefix: `${query}%` })
        .orderBy('h_priority', 'ASC')
        .addOrderBy('h.name', 'ASC')
        .take(perGroup)
        .getMany();

      hotels.forEach((h) => {
        items.push(
          this.buildItem({
            type: 'hotel',
            id: h.id,
            label: h.name,
            query,
            subtitle: [
              h.address_line,
              this.buildAdminLabel('phường', h.ward_name),
              this.buildAdminLabel('quận', h.district_name),
              this.buildAdminLabel('thàn phố', h.province_name),
            ]
              .filter(Boolean)
              .join(', '),
            province_id: h.province_id,
            district_id: h.district_id,
            ward_id: h.ward_id,
            hotel_id: h.id,
          }),
        );
      });
    }
    if (typeList.includes('province')) {
      const provinces = await this.provinceRepo
        .createQueryBuilder('p')
        .where('p.status = :st', { st: 'active' })
        .andWhere('(p.name_ascii LIKE :s OR p.code LIKE :raw)', {
          s: `%${asciiQ}%`,
          raw: `%${query}%`,
        })
        .addSelect(
          `CASE WHEN p.name_ascii LIKE :prefixAscii THEN 0 ELSE 1 END`,
          'p_priority',
        )
        .setParameters({ prefixAscii: `${asciiQ}%` })
        .orderBy('p_priority', 'ASC')
        .addOrderBy('p.name_ascii', 'ASC')
        .take(perGroup)
        .getMany();

      provinces.forEach((p) => {
        items.push(
          this.buildItem({
            type: 'province',
            id: p.id,
            label: p.name,
            query,
            subtitle: `Tỉnh/Thành • Mã ${p.code}`,
            province: p,
            province_id: p.id,
          }),
        );
      });
    }
    if (typeList.includes('district')) {
      const districts = await this.districtRepo
        .createQueryBuilder('d')
        .leftJoinAndSelect('d.province', 'p')
        .where('d.status = :st', { st: 'active' })
        .andWhere('(d.name_ascii LIKE :s OR d.code LIKE :raw)', {
          s: `%${asciiQ}%`,
          raw: `%${query}%`,
        })
        .addSelect(
          `CASE WHEN d.name_ascii LIKE :prefixAscii THEN 0 ELSE 1 END`,
          'd_priority',
        )
        .setParameters({ prefixAscii: `${asciiQ}%` })
        .orderBy('d_priority', 'ASC')
        .addOrderBy('d.name_ascii', 'ASC')
        .take(perGroup)
        .getMany();

      districts.forEach((d) => {
        items.push(
          this.buildItem({
            type: 'district',
            id: d.id,
            label: d.name,
            query,
            subtitle: [d.province?.name, `Mã ${d.code}`]
              .filter(Boolean)
              .join(' • '),
            district: d,
            province: d.province,
            province_id: d.province_id,
            district_id: d.id,
          }),
        );
      });
    }
    if (typeList.includes('ward')) {
      const wards = await this.wardRepo
        .createQueryBuilder('w')
        .leftJoinAndSelect('w.district', 'd')
        .leftJoinAndSelect('d.province', 'p')
        .where('w.status = :st', { st: 'active' })
        .andWhere('(w.name_ascii LIKE :s OR w.code LIKE :raw)', {
          s: `%${asciiQ}%`,
          raw: `%${query}%`,
        })
        .addSelect(
          `CASE WHEN w.name_ascii LIKE :prefixAscii THEN 0 ELSE 1 END`,
          'w_priority',
        )
        .setParameters({ prefixAscii: `${asciiQ}%` })
        .orderBy('w_priority', 'ASC')
        .addOrderBy('w.name_ascii', 'ASC')
        .take(perGroup)
        .getMany();

      wards.forEach((w) => {
        items.push(
          this.buildItem({
            type: 'ward',
            id: w.id,
            label: w.name,
            query,
            subtitle: [
              w.district?.name,
              w.district?.province?.name,
              `Mã ${w.code}`,
            ]
              .filter(Boolean)
              .join(' • '),
            ward: w,
            district: w.district,
            province: w.district?.province,
            province_id: w.district?.province?.id,
            district_id: w.district_id,
            ward_id: w.id,
          }),
        );
      });
    }
    return items.slice(0, limit);
  }
  private computeNights(checkin: string, checkout: string): number {
    const ci = new Date(checkin);
    const co = new Date(checkout);
    const diffMs = co.getTime() - ci.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  async search(dto: AvailabilitySearchDto): Promise<AvailabilityResponse> {
    const nights = this.computeNights(dto.checkin, dto.checkout);
    if (nights <= 0) throw new BadRequestException('checkout phải sau checkin');

    const totalGuests = dto.adults + dto.children;

    const rtQB = this.roomTypeRepo
      .createQueryBuilder('rt')
      .innerJoin(Hotel, 'h', 'h.id = rt.hotel_id')
      .addSelect([
        'h.id',
        'h.name',
        'h.star_rating',
        'h.address_line',
        'h.province_name',
        'h.district_name',
        'h.ward_name',
        'h.province_id',
        'h.district_id',
        'h.ward_id',
      ])
      .where('rt.is_active = :active', { active: true })
      .andWhere('rt.max_adults >= :adults', { adults: dto.adults })
      .andWhere('rt.max_children >= :children', { children: dto.children })
      .andWhere('rt.max_occupancy >= :totalGuests', { totalGuests });

    if (dto.hotelId) {
      rtQB.andWhere('h.id = :hid', { hid: dto.hotelId });
    } else {
      if (dto.provinceId)
        rtQB.andWhere('h.province_id = :prov', { prov: dto.provinceId });
      if (dto.districtId)
        rtQB.andWhere('h.district_id = :dist', { dist: dto.districtId });
      if (dto.wardId) rtQB.andWhere('h.ward_id = :ward', { ward: dto.wardId });
    }

    if (dto.minStar != null)
      rtQB.andWhere('h.star_rating >= :minStar', { minStar: dto.minStar });
    if (dto.maxStar != null)
      rtQB.andWhere('h.star_rating <= :maxStar', { maxStar: dto.maxStar });

    // SUBQUERY
    if (dto.hotelAmenityIds?.length) {
      rtQB.andWhere(
        `
      (
        SELECT COUNT(DISTINCT am_h.amenity_id)
        FROM amenity_mappings am_h
        WHERE am_h.hotel_id = h.id
          AND am_h.room_type_id IS NULL
          AND am_h.amenity_id IN (:...hotelAmenityIds)
      ) = :hotelAmenityCount
      `,
        {
          hotelAmenityIds: dto.hotelAmenityIds,
          hotelAmenityCount: dto.hotelAmenityIds.length,
        },
      );
    }
    if (dto.roomAmenityIds?.length) {
      rtQB.andWhere(
        `
      (
        SELECT COUNT(DISTINCT am_r.amenity_id)
        FROM amenity_mappings am_r
        WHERE am_r.room_type_id = rt.id
          AND am_r.amenity_id IN (:...roomAmenityIds)
      ) = :roomAmenityCount
      `,
        {
          roomAmenityIds: dto.roomAmenityIds,
          roomAmenityCount: dto.roomAmenityIds.length,
        },
      );
    }

    // Điều kiện cho rate plan để dùng chung giữa EXISTS và "load rate plans"
    let rpCond = '';
    const rpParams: Record<string, any> = {};

    if (dto.minPrice != null && dto.maxPrice != null) {
      rpCond += ' AND rp.price_amount BETWEEN :minPrice AND :maxPrice';
      rpParams['minPrice'] = dto.minPrice;
      rpParams['maxPrice'] = dto.maxPrice;
    } else if (dto.minPrice != null) {
      rpCond += ' AND rp.price_amount >= :minPrice';
      rpParams['minPrice'] = dto.minPrice;
    } else if (dto.maxPrice != null) {
      rpCond += ' AND rp.price_amount <= :maxPrice';
      rpParams['maxPrice'] = dto.maxPrice;
    }

    if (dto.payAtHotelOnly) {
      rpCond += ' AND rp.prepayment_required = false';
    }

    // Chỉ lấy room type nếu tồn tại ít nhất 1 rate plan match điều kiện
    rtQB.andWhere(
      `
    EXISTS (
      SELECT 1
      FROM rate_plans rp
      WHERE rp.room_type_id = rt.id
      ${rpCond}
    )
    `,
      rpParams,
    );

    // best_price để sort
    rtQB.addSelect(
      `
      (
        SELECT MIN(rp2.price_amount)
        FROM rate_plans rp2
        WHERE rp2.room_type_id = rt.id
        ${rpCond.replaceAll('rp.', 'rp2.')}
      )
      `,
      'best_price',
    );

    const sortDir = dto.sortPrice === 'asc' ? 'ASC' : 'DESC';
    rtQB.orderBy('best_price IS NULL', 'ASC').addOrderBy('best_price', sortDir);

    const rows = await rtQB.getRawAndEntities();
    const roomTypes = rows.entities;
    const rawList = rows.raw;

    const rtBestPriceMap = new Map<number, number | null>();
    rawList.forEach((r) => {
      const rtId = Number(r['rt_id'] ?? r['rt_id']);
      const bpRaw = r['best_price'];
      const bp = bpRaw != null ? Number(bpRaw) : null;
      rtBestPriceMap.set(
        rtId,
        Number.isFinite(bp as number) ? (bp as number) : null,
      );
    });

    if (!roomTypes.length) {
      return {
        meta: {
          checkin: dto.checkin,
          checkout: dto.checkout,
          nights,
          requested_rooms: dto.rooms,
          adults: dto.adults,
          children: dto.children,
          total_guests: totalGuests,
        },
        hotels: [],
      };
    }

    const hotelInfoMap = new Map<
      number,
      {
        name: string;
        star_rating?: number;
        address_line?: string;
        province?: string;
        district?: string;
        ward?: string;
      }
    >();
    rawList.forEach((r) => {
      const hid = Number(r['h_id']);
      if (!hotelInfoMap.has(hid)) {
        hotelInfoMap.set(hid, {
          name: r['h_name'],
          star_rating: r['h_star_rating']
            ? Number(r['h_star_rating'])
            : undefined,
          address_line: r['h_address_line'],
          province: r['h_province_name'],
          district: r['h_district_name'],
          ward: r['h_ward_name'],
        });
      }
    });

    const roomTypeIds = roomTypes.map((r) => r.id);
    const invRows = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('inv.room_type_id', 'room_type_id')
      .addSelect(
        'MIN(inv.available_rooms - inv.blocked_rooms - inv.rooms_sold)',
        'min_available',
      )
      .addSelect('COUNT(DISTINCT inv.inventory_date)', 'days_count')
      .addSelect('MAX(inv.total_rooms)', 'total_rooms_snapshot')
      .where('inv.room_type_id IN (:...rids)', { rids: roomTypeIds })
      .andWhere('inv.inventory_date >= :ci', { ci: dto.checkin })
      .andWhere('inv.inventory_date < :co', { co: dto.checkout })
      .andWhere('(inv.stop_sell IS NULL OR inv.stop_sell = 0)')
      .groupBy('inv.room_type_id')
      .getRawMany<{
        room_type_id: string;
        min_available: string;
        days_count: string;
        total_rooms_snapshot: string;
      }>();

    const invMap = new Map<
      number,
      {
        min_available: number;
        days_count: number;
        total_rooms_snapshot: number;
      }
    >();
    invRows.forEach((r) => {
      invMap.set(parseInt(r.room_type_id, 10), {
        min_available: parseInt(r.min_available, 10),
        days_count: parseInt(r.days_count, 10),
        total_rooms_snapshot: parseInt(r.total_rooms_snapshot, 10),
      });
    });

    const hotelMap = new Map<number, HotelAvailability>();

    // Chỉ giữ các roomType qua được tồn kho (không "đóng")
    const eligibleRoomTypeIds: number[] = [];

    for (const rt of roomTypes) {
      const inv = invMap.get(Number(rt.id));
      if (!inv || inv.days_count !== nights) continue;
      if (inv.min_available < dto.rooms) continue;

      const bestPrice = rtBestPriceMap.get(Number(rt.id)) ?? null;
      const hotelId = rt.hotel_id;
      const info = hotelInfoMap.get(Number(hotelId));
      if (!info) continue;

      if (!hotelMap.has(Number(hotelId))) {
        const images = await this.hotelsService.loadImageByHotel(hotelId);
        const amenity=await this.amenityMappingsService.getMappingsGroupedHotel(hotelId)
        const hotelPolicies = await this.hotelPoliciesService.findOne(
          null,
          hotelId,
        );
        hotelMap.set(Number(hotelId), {
          hotel_id: Number(hotelId),
          hotel_name: info.name,
          star_rating: info.star_rating,
          address_line: info.address_line,
          province: info.province,
          district: info.district,
          ward: info.ward,
          hotel_min_price: undefined,
          matched_room_types: [],
          images: images,
          hotelPolicies: hotelPolicies,
          amenity:amenity
        });
      }
      const current = hotelMap.get(Number(hotelId))!;
      if (bestPrice != null) {
        if (
          current.hotel_min_price == null ||
          (typeof current.hotel_min_price === 'number' &&
            bestPrice < current.hotel_min_price)
        ) {
          current.hotel_min_price = bestPrice;
        }
      }
      const rtAvail: RoomTypeAvailability & {
        rate_plans?: RatePlanPrice[];
      } = {
        room_type_id: Number(rt.id),
        name: rt.name,
        bed_config: rt.bed_config,
        floor_level: rt.floor_level,
        smoking_allowed: rt.smoking_allowed,
        view: rt.view,
        description: rt.description,
        max_occupancy: rt.max_occupancy,
        total_rooms: inv.total_rooms_snapshot || rt.total_rooms,
        best_price: bestPrice ?? undefined,
      };

      current.matched_room_types.push(rtAvail);
      eligibleRoomTypeIds.push(Number(rt.id));
    }

    if (eligibleRoomTypeIds.length > 0) {
      const rpQB = this.ratePlanRepo
        .createQueryBuilder('rp')
        .where('rp.room_type_id IN (:...rids)', { rids: eligibleRoomTypeIds });

      if (dto.minPrice != null && dto.maxPrice != null) {
        rpQB.andWhere('rp.price_amount BETWEEN :minPrice AND :maxPrice', {
          minPrice: dto.minPrice,
          maxPrice: dto.maxPrice,
        });
      } else if (dto.minPrice != null) {
        rpQB.andWhere('rp.price_amount >= :minPrice', {
          minPrice: dto.minPrice,
        });
      } else if (dto.maxPrice != null) {
        rpQB.andWhere('rp.price_amount <= :maxPrice', {
          maxPrice: dto.maxPrice,
        });
      }

      if (dto.payAtHotelOnly) {
        rpQB.andWhere('rp.prepayment_required = false');
      }

      // Tùy schema: nếu có cờ kích hoạt cho rate plan thì bật điều kiện này
      // rpQB.andWhere('rp.is_active = true');

      const ratePlans = await rpQB.getMany();

      // Nhóm rate plans theo room_type_id và tính giá theo occupancy
      const rpGroup = new Map<number, RatePlanPrice[]>();
      for (const rp of ratePlans) {
        const price = this.computeRatePlanPrice(
          rp,
          dto.adults,
          dto.children,
          nights,
          dto.rooms,
        );
        const list = rpGroup.get(Number(rp.room_type_id)) ?? [];
        list.push(price);
        rpGroup.set(Number(rp.room_type_id), list);
      }

      // Sắp xếp các rate plan theo nightly_total tăng dần để tiện hiển thị
      rpGroup.forEach((arr) =>
        arr.sort((a, b) => a.nightly_total - b.nightly_total),
      );

      // Gắn rate plans vào từng room type tương ứng
      for (const hotel of hotelMap.values()) {
        for (const rt of hotel.matched_room_types as (RoomTypeAvailability & {
          rate_plans?: RatePlanPrice[];
        })[]) {
          rt.rate_plans = rpGroup.get(rt.room_type_id) ?? [];
        }
      }
    }

    const hotels = Array.from(hotelMap.values()).filter(
      (h) => h.matched_room_types.length > 0,
    );

    return {
      meta: {
        checkin: dto.checkin,
        checkout: dto.checkout,
        nights,
        requested_rooms: dto.rooms,
        adults: dto.adults,
        children: dto.children,
        total_guests: totalGuests,
      },
      hotels,
    };
  }

  private computeRatePlanPrice(
    rp: RatePlan,
    adults: number,
    children: number,
    nights: number,
    requestedRooms: number,
  ): RatePlanPrice {
    const base_used_by_adults = Math.min(adults, rp.base_occupancy);
    const remaining_base = rp.base_occupancy - base_used_by_adults;
    const base_used_by_children = Math.min(children, remaining_base);

    const extra_adults = adults - base_used_by_adults;
    const extra_children = children - base_used_by_children;

    const nightly_total =
      Number(rp.price_amount) +
      (extra_adults > 0 ? extra_adults * Number(rp.extra_adult_fee) : 0) +
      (extra_children > 0 ? extra_children * Number(rp.extra_child_fee) : 0);

    const stay_total = nightly_total * nights * requestedRooms;

    return {
      rate_plan_id: Number(rp.id),
      name: rp.name,
      description: rp.description,
      prepayment_required: rp.prepayment_required === true,
      price_amount: Number(rp.price_amount),
      nightly_total,
      stay_total,
    };
  }
}
