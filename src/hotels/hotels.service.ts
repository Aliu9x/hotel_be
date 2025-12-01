import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
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

  // Helper: get current user's hotel id (from token if provided, else lookup)
  async findHotelIdByOwner(ownerId: string | number): Promise<string | null> {
    const idStr = String(ownerId);
    const row = await this.hotelRepo.findOne({
      select: ['id'],
      where: { created_by_user_id: idStr },
    });
    if (!row) return null;
    return String(row.id);
  }

  // Create hotel with single-hotel-per-account policy
  async createHotel(dto: CreateHotelDto, user: IUser) {
    // Enforce numeric registration_code
    if (!/^[0-9]+$/.test(dto.registration_code)) {
      throw new BadRequestException('registration_code phải là số');
    }

    // Enforce one hotel per account
    const existed = await this.hotelRepo.findOne({
      select: ['id'],
      where: { created_by_user_id: String(user.id) },
    });
    if (existed) {
      throw new ConflictException(
        `Tài khoản đã tạo khách sạn (id=${existed.id}). Chỉ được tạo 1 khách sạn.`,
      );
    }

    // Resolve location names if provided
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

    const dir = path.join(
      process.cwd(),
      'public',
      'contract',
      String(saved.id),
    );
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return saved;
  }

  async getHotelOrThrowById(id: string) {
    const hotel = await this.hotelRepo.findOne({ where: { id: String(id) } });
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async getCurrentUsersHotelOrThrow(user: IUser) {
    const hid = await this.hotelRepo.findOne({ where: { id: user.hotel_id } });
    if (!hid) throw new NotFoundException('Tài khoản chưa có khách sạn');
    return hid;
  }

  async updateMyHotelContract(dto: UpdateContractDto, user: IUser) {
    const hotel = await this.getCurrentUsersHotelOrThrow(user);

    hotel.legal_name = dto.legal_name;
    hotel.legal_address = dto.legal_address;

    hotel.signer_full_name = dto.signer_full_name;
    hotel.signer_phone = dto.signer_phone;
    hotel.signer_email = dto.signer_email;

    if (dto.identity_doc_filename)
      hotel.identity_doc_filename = dto.identity_doc_filename;
    if (dto.contract_pdf_filename)
      hotel.contract_pdf_filename = dto.contract_pdf_filename;

    await this.hotelRepo.save(hotel);
    return hotel;
  }
  async saveMyHotelContractFiles(
    user: IUser,
    pdfFile?: Express.Multer.File,
    identityImage?: Express.Multer.File,
  ) {
    const hotel = await this.getCurrentUsersHotelOrThrow(user);
    const hotelId = String(hotel.id);

    const dir = path.join(process.cwd(), 'public', 'contract', hotelId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let contractPdfFilename: string | undefined;
    let identityDocFilename: string | undefined;

    if (pdfFile) {
      const ext = path.extname(pdfFile.originalname).toLowerCase();
      if (ext !== '.pdf')
        throw new BadRequestException('Hợp đồng phải là file PDF');
      contractPdfFilename = `contract_${Date.now()}.pdf`;
      fs.writeFileSync(path.join(dir, contractPdfFilename), pdfFile.buffer);
      hotel.contract_pdf_filename = contractPdfFilename;
    }

    if (identityImage) {
      const extImg = path.extname(identityImage.originalname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(extImg)) {
        throw new BadRequestException('Ảnh CCCD phải là JPG/PNG');
      }
      identityDocFilename = `cccd_${Date.now()}${extImg}`;
      fs.writeFileSync(
        path.join(dir, identityDocFilename),
        identityImage.buffer,
      );
      hotel.identity_doc_filename = identityDocFilename;
    }

    await this.hotelRepo.save(hotel);

    return {
      contract_pdf_filename: hotel.contract_pdf_filename,
      identity_doc_filename: hotel.identity_doc_filename,
    };
  }
}
