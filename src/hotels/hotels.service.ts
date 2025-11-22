import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Hotel, HotelApprovalStatus } from './entities/hotel.entity';
import { Repository } from 'typeorm';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { ListHotelsDto } from './dto/list-hotels.dto';
import { Province } from 'src/locations/entities/province.entity';
import { District } from 'src/locations/entities/district.entity';
import { Ward } from 'src/locations/entities/ward.entity';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel) private readonly hotelRepo: Repository<Hotel>,
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
    @InjectRepository(Ward) private readonly wardRepo: Repository<Ward>,
  ) {}

  async findHotelIdByOwner(ownerId: string | number): Promise<string | null> {
    const idStr = String(ownerId);
    const row = await this.hotelRepo.findOne({
      select: ['id'],
      where: { created_by_user_id: idStr },
    });
    if (!row) return null;
    return String(row.id);
  }

  async create(createDto: CreateHotelDto) {
    let provinceName: string | undefined;
    let districtName: string | undefined;
    let wardName: string | undefined;

    // Lấy tên từ ID để lưu vào các cột denormalized (tuỳ bạn có thể bỏ)
    if (createDto.province_id) {
      const p = await this.provinceRepo.findOne({
        where: { id: createDto.province_id },
      });
      if (!p) throw new BadRequestException('province_id không tồn tại');
      provinceName = p.name;
    }
    if (createDto.district_id) {
      const d = await this.districtRepo.findOne({
        where: { id: createDto.district_id },
      });
      if (!d) throw new BadRequestException('district_id không tồn tại');
      districtName = d.name;
    }
    if (createDto.ward_id) {
      const w = await this.wardRepo.findOne({
        where: { id: createDto.ward_id },
      });
      if (!w) throw new BadRequestException('ward_id không tồn tại');
      wardName = w.name;
    }

    const hotel = this.hotelRepo.create({
      ...createDto,
      province: provinceName,
      district: districtName,
      ward: wardName,
      country_code: createDto.country_code || 'VN',
      timezone: createDto.timezone || 'Asia/Ho_Chi_Minh',
      approval_status: createDto.approval_status || HotelApprovalStatus.PENDING,
    });

    return this.hotelRepo.save(hotel);
  }

  async update(id: string, dto: UpdateHotelDto) {
    const hotel = await this.hotelRepo.findOne({ where: { id } });
    if (!hotel) throw new NotFoundException('Hotel not found');

    // Nếu cập nhật location IDs
    if (dto.province_id !== undefined) {
      if (dto.province_id === null) {
        hotel.province_id = undefined;
        hotel.province = undefined;
      } else {
        const p = await this.provinceRepo.findOne({
          where: { id: dto.province_id },
        });
        if (!p) throw new BadRequestException('province_id không tồn tại');
        hotel.province_id = p.id;
        hotel.province = p.name;
      }
    }
    if (dto.district_id !== undefined) {
      if (dto.district_id === null) {
        hotel.district_id = undefined;
        hotel.district = undefined;
      } else {
        const d = await this.districtRepo.findOne({
          where: { id: dto.district_id },
        });
        if (!d) throw new BadRequestException('district_id không tồn tại');
        hotel.district_id = d.id;
        hotel.district = d.name;
      }
    }
    if (dto.ward_id !== undefined) {
      if (dto.ward_id === null) {
        hotel.ward_id = undefined;
        hotel.ward = undefined;
      } else {
        const w = await this.wardRepo.findOne({ where: { id: dto.ward_id } });
        if (!w) throw new BadRequestException('ward_id không tồn tại');
        hotel.ward_id = w.id;
        hotel.ward = w.name;
      }
    }

    // Các field khác
    Object.assign(hotel, {
      name: dto.name ?? hotel.name,
      description: dto.description ?? hotel.description,
      phone: dto.phone ?? hotel.phone,
      email: dto.email ?? hotel.email,
      address_line: dto.address_line ?? hotel.address_line,
      city: dto.city ?? hotel.city,
      country_code: dto.country_code ?? hotel.country_code,
      timezone: dto.timezone ?? hotel.timezone,
      approval_status: dto.approval_status ?? hotel.approval_status,
      star_rating: dto.star_rating ?? hotel.star_rating,
    });

    return this.hotelRepo.save(hotel);
  }

  async findAll(query: ListHotelsDto) {
    const {
      q,
      city,
      provinceId,
      districtId,
      wardId,
      status,
      page = 1,
      limit = 10,
      orderBy = 'created_at',
      order = 'DESC',
      starMin,
      starMax,
    } = query;

    const allowedOrderBy = ['created_at', 'name', 'star_rating', 'updatedAt'];
    const safeOrderBy = allowedOrderBy.includes(orderBy)
      ? orderBy
      : 'created_at';
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.hotelRepo.createQueryBuilder('hotel');

    // Search q mở rộng
    if (q && q.trim()) {
      const search = `%${q.trim()}%`;
      qb.andWhere(
        `(hotel.name LIKE :search OR hotel.email LIKE :search OR hotel.address_line LIKE :search 
          OR hotel.phone LIKE :search OR hotel.province LIKE :search OR hotel.district LIKE :search 
          OR hotel.ward LIKE :search OR hotel.city LIKE :search)`,
        { search },
      );
    }

    if (city) qb.andWhere('hotel.city = :city', { city });

    if (provinceId)
      qb.andWhere('hotel.province_id = :provinceId', { provinceId });
    if (districtId)
      qb.andWhere('hotel.district_id = :districtId', { districtId });
    if (wardId) qb.andWhere('hotel.ward_id = :wardId', { wardId });

    if (status) qb.andWhere('hotel.approval_status = :status', { status });

    if (starMin) qb.andWhere('hotel.star_rating >= :starMin', { starMin });
    if (starMax) qb.andWhere('hotel.star_rating <= :starMax', { starMax });

    const total = await qb.getCount();

    qb.orderBy(`hotel.${safeOrderBy}`, safeOrder);
    const offset = (page - 1) * limit;
    qb.skip(offset).take(limit);

    const result = await qb.getMany();
    const pages = Math.ceil(total / limit) || 1;
    return {
      meta: {
        page,
        limit,
        pages,
        total,
      },
      result,
    };
  }

  async findOne(id: string, user: IUser) {
    const hotel = await this.hotelRepo.findOne({ where: { id } });
    if (!hotel) throw new NotFoundException('Không tìm thấy khách sạn');

    if (user.role === Role.ADMIN) return hotel;

    if (user.role === Role.HOTEL_OWNER) {
      if (hotel.created_by_user_id !== user.id) {
        throw new ForbiddenException('Không có quyền truy cập khách sạn này');
      }
      return hotel;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} hotel`;
  }
}
