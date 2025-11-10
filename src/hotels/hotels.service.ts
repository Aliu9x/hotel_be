import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Hotel, HotelApprovalStatus } from './entities/hotel.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IUser, Role } from 'src/interfaces/customize.interface';
import {
  HotelModuleSubscription,
  SubscriptionStatus,
} from 'src/hotel-module-subscriptions/entities/hotel-module-subscription.entity';
import { HotelModuleCode } from 'src/hotel-modules/entities/hotel-module.entity';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel) private readonly hotelRepo: Repository<Hotel>,
    @InjectRepository(HotelModuleSubscription)
    private readonly hotelModuleSubscriptionRepo: Repository<HotelModuleSubscription>,
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
  
  async create(dto: CreateHotelDto, user: IUser) {
    if (!(user.role === Role.ADMIN || user.role === Role.HOTEL_OWNER)) {
      throw new ForbiddenException('Bạn không có quyền tạo khách sạn');
    }

    const hotel = this.hotelRepo.create({
      ...dto,
      created_by_user_id: user.id,
    });
    const savedHotel = await this.hotelRepo.save(hotel);

    const hotelModuleSubscription = this.hotelModuleSubscriptionRepo.create({
      hotel_id: savedHotel.id,
      module_code: HotelModuleCode.BILLING,
      status: SubscriptionStatus.PENDING,
    });

    await this.hotelModuleSubscriptionRepo.save(hotelModuleSubscription);
    return savedHotel;
  }

  findAll(user: IUser) {
    const where: FindOptionsWhere<Hotel>[] = [];

    if (user.role === Role.ADMIN) {
      return this.hotelRepo.find({ order: { created_at: 'DESC' } });
    }

    if (user.role === Role.HOTEL_OWNER) {
      return this.hotelRepo.find({
        where: { created_by_user_id: user.id },
      });
    }

    where.push({
      approval_status: HotelApprovalStatus.APPROVED,
      is_active: true,
    } as any);

    return this.hotelRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
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

  async update(id: string, dto: UpdateHotelDto, user: IUser) {
    const hotel = await this.hotelRepo.findOne({ where: { id } });
    if (!hotel) throw new NotFoundException('Không tìm thấy khách sạn');

    if (user.role === Role.ADMIN) {
      if ((dto as any).code) delete (dto as any).code;
    } else if (user.role === Role.HOTEL_OWNER) {
      if (hotel.created_by_user_id !== user.id) {
        throw new ForbiddenException('Không có quyền cập nhật khách sạn này');
      }
      delete (dto as any).is_active;
      delete (dto as any).approval_status;
      delete (dto as any).code;
    } else {
      throw new ForbiddenException('Không có quyền cập nhật khách sạn');
    }

    const toSave = this.hotelRepo.merge(hotel, dto);
    return this.hotelRepo.save(toSave);
  }

  remove(id: number) {
    return `This action removes a #${id} hotel`;
  }
  
}
