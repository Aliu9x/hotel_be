import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Province } from 'src/locations/entities/province.entity';
import { District } from 'src/locations/entities/district.entity';
import { Ward } from 'src/locations/entities/ward.entity';
import { IUser } from 'src/interfaces/customize.interface';
import * as fs from 'fs';
import * as path from 'path';
import { HotelImage, ImageStatus } from './entities/hotel-image.entity';
import { ListHotelsDto } from './dto/list-hotels.dto';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel) private readonly hotelRepo: Repository<Hotel>,
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
    @InjectRepository(Ward) private readonly wardRepo: Repository<Ward>,
    @InjectRepository(HotelImage)
    private readonly hotelImage: Repository<HotelImage>,
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

  async getHotelOrThrowById(id: string) {
    const hotel = await this.hotelRepo.findOne({ where: { id: String(id) } });
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async getCurrentUsersHotelOrThrow(user: IUser) {
    const hid = await this.hotelRepo.findOne({
      where: { id: user.hotel_id, created_by_user_id: user.id },
    });
    if (!hid) throw new BadRequestException('Tài khoản chưa có khách sạn');
    return hid;
  }
  async createHotel(dto: CreateHotelDto, user: IUser) {
    if (!/^[0-9]+$/.test(dto.registration_code)) {
      throw new BadRequestException('registration_code phải là số');
    }
    const existed = await this.hotelRepo.findOne({
      select: ['id'],
      where: { created_by_user_id: String(user.id) },
    });
    if (existed) {
      throw new ConflictException(
        `Tài khoản đã tạo khách sạn (id=${existed.id}). Chỉ được tạo 1 khách sạn.`,
      );
    }
    let provinceName: string | undefined;
    let districtName: string | undefined;
    let wardName: string | undefined;

    if (dto.province_id) {
      const p = await this.provinceRepo.findOne({
        where: { id: dto.province_id },
      });
      if (!p) throw new BadRequestException('province_id không tồn tại');
      provinceName = p.name;
    }
    if (dto.district_id) {
      const d = await this.districtRepo.findOne({
        where: { id: dto.district_id },
      });
      if (!d) throw new BadRequestException('district_id không tồn tại');
      districtName = d.name;
    }
    if (dto.ward_id) {
      const w = await this.wardRepo.findOne({ where: { id: dto.ward_id } });
      if (!w) throw new BadRequestException('ward_id không tồn tại');
      wardName = w.name;
    }

    const hotel = this.hotelRepo.create({
      registration_code: dto.registration_code,
      approval_status: dto.approval_status || 'PENDING',
      name: dto.name,
      description: dto.description,
      star_rating: dto.star_rating,
      address_line: dto.address_line,
      province_id: dto.province_id,
      district_id: dto.district_id,
      ward_id: dto.ward_id,
      contact_name: dto.contact_name,
      contact_email: dto.contact_email,
      contact_phone: dto.contact_phone,
      province_name: provinceName,
      district_name: districtName,
      ward_name: wardName,
      created_by_user_id: String(user.id),
    });

    const saved = await this.hotelRepo.save(hotel);

    const dir = path.join(process.cwd(), 'public', 'images', 'contract');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return saved;
  }
  async updateMyHotelContract(dto: UpdateContractDto) {
    const idNum = Number(dto?.id_hotel);

    if (!idNum || Number.isNaN(idNum)) {
      throw new BadRequestException(
        'User chưa có hotel_id hợp lệ. Vui lòng hoàn tất Mục 1 để tạo khách sạn.',
      );
    }

    const hotel = await this.hotelRepo.findOne({
      where: { id: String(idNum) },
    });
    if (!hotel) {
      throw new NotFoundException(`Không tìm thấy khách sạn với id=${idNum}.`);
    }

    hotel.legal_name = dto.legal_name;
    hotel.legal_address = dto.legal_address;
    hotel.signer_full_name = dto.signer_full_name;
    hotel.signer_phone = dto.signer_phone;
    hotel.signer_email = dto.signer_email;

    if (dto.identity_doc_filename) {
      hotel.identity_doc_filename = dto.identity_doc_filename;
    }
    if (dto.contract_pdf_filename) {
      hotel.contract_pdf_filename = dto.contract_pdf_filename;
    }

    await this.hotelRepo.save(hotel);
    return hotel;
  }

  async saveMyHotelContractFiles(
    id: string,
    pdfFile?: Express.Multer.File,
    identityImage?: Express.Multer.File,
  ) {
    if (!pdfFile && !identityImage) {
      throw new BadRequestException('Thiếu file upload');
    }

    const idNum = Number(id);

    if (!idNum || Number.isNaN(idNum)) {
      throw new BadRequestException(
        'User chưa có hotel_id hợp lệ. Vui lòng hoàn tất Mục 1 để tạo khách sạn.',
      );
    }

    const hotel = await this.hotelRepo.findOne({
      where: { id: String(idNum) },
    });
    if (!hotel) {
      throw new NotFoundException(`Không tìm thấy khách sạn với id=${idNum}.`);
    }

    const dir = path.join(process.cwd(), 'public', 'images', 'contract');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (pdfFile) {
      const ext = path.extname(pdfFile.originalname).toLowerCase();
      if (ext !== '.pdf') {
        throw new BadRequestException('Hợp đồng phải là file PDF');
      }
      const filename = `contract_${Date.now()}.pdf`;
      fs.writeFileSync(path.join(dir, filename), pdfFile.buffer);
      hotel.contract_pdf_filename = filename;
    }

    if (identityImage) {
      const extImg = path.extname(identityImage.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(extImg)) {
        throw new BadRequestException('Ảnh CCCD phải là JPG/PNG');
      }
      const filename = `cccd_${Date.now()}${extImg}`;
      fs.writeFileSync(path.join(dir, filename), identityImage.buffer);
      hotel.identity_doc_filename = filename;
    }

    await this.hotelRepo.save(hotel);

    return {
      contract_pdf_filename: hotel.contract_pdf_filename,
      identity_doc_filename: hotel.identity_doc_filename,
    };
  }

  async loadImagesFileNames(
    user: IUser,
  ): Promise<{ thumbnail: string | null; slider: string[] }> {
    if (user.hotel_id === null) {
      throw new BadRequestException('khong cos tk ks ');
    }
    const hotelId = Number(user.hotel_id);
    if (!hotelId || Number.isNaN(hotelId)) {
      throw new BadRequestException('hotel_id không hợp lệ');
    }
    const hotel = await this.hotelRepo.findOne({
      where: { id: user.hotel_id },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found for current user');
    }
    const rows = await this.hotelImage.find({
      where: { hotel_id: user.hotel_id, status: ImageStatus.APPROVED },
      order: { id: 'ASC' },
    });
    if (rows.length === 0) {
      return { thumbnail: null, slider: [] };
    }

    let cover = rows.find((r) => r.is_cover === true) ?? null;
    const coverId = cover?.id ?? null;
    const gallery = rows.filter((r) => r.id !== coverId);

    return {
      thumbnail: cover ? cover.file_name : null,
      slider: gallery.map((g) => g.file_name),
    };
  }

  async loadImageByHotel(id: string) {
    const hotel = await this.hotelRepo.findOne({
      where: { id },
    });

    if (!hotel) {
      throw new NotFoundException('No hotel');
    }

    const images = await this.hotelImage.find({
      where: { hotel_id: id, status: ImageStatus.APPROVED },
      select: ['file_name'],
      order: {
        is_cover: 'DESC',
        created_at: 'ASC',
      },
    });

    return images.map((i) => i.file_name);
  }

  async list(
    params: ListHotelsDto,
  ): Promise<{ result: Hotel[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      q,
      status,
      provinceId,
      districtId,
      wardId,
      starRating,
      orderBy = 'created_at',
      order = 'DESC',
    } = params;

    const qb = this.hotelRepo.createQueryBuilder('h');

    if (q) {
      qb.andWhere('LOWER(h.name) LIKE :q', { q: `%${q.toLowerCase()}%` });
    }

    if (status) {
      qb.andWhere('h.approval_status = :status', { status });
    }

    if (provinceId) {
      qb.andWhere('h.province_id = :provinceId', { provinceId });
    }

    if (districtId) {
      qb.andWhere('h.district_id = :districtId', { districtId });
    }

    if (wardId) {
      qb.andWhere('h.ward_id = :wardId', { wardId });
    }

    if (starRating) {
      qb.andWhere('h.star_rating = :starRating', { starRating });
    }

    const safeOrderBy = [
      'created_at',
      'updated_at',
      'star_rating',
      'name',
    ].includes(orderBy)
      ? orderBy
      : 'created_at';
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`h.${safeOrderBy}`, safeOrder as 'ASC' | 'DESC');

    qb.skip((page - 1) * limit).take(limit);

    const [result, total] = await qb.getManyAndCount();

    return { result, total, page, limit };
  }

  async getById(id: number): Promise<Hotel | null> {
    return await this.hotelRepo.findOne({
      where: { id: String(id) },
    });
  }

  async updateApprovalStatus(
    id: number,
    status: Hotel['approval_status'],
  ): Promise<Hotel | null> {
    const hotel = await this.hotelRepo.findOne({
      where: { id: String(id) },
    });
    if (!hotel) return null;
    hotel.approval_status = status;
    await this.hotelRepo.save(hotel);
    return hotel;
  }
}
