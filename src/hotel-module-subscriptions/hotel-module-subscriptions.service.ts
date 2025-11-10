import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHotelModuleSubscriptionDto } from './dto/create-hotel-module-subscription.dto';
import { UpdateHotelModuleSubscriptionDto } from './dto/update-hotel-module-subscription.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  HotelModuleSubscription,
  SubscriptionStatus,
} from './entities/hotel-module-subscription.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { HotelModuleCode } from 'src/hotel-modules/entities/hotel-module.entity';

@Injectable()
export class HotelModuleSubscriptionsService {
  constructor(
    @InjectRepository(HotelModuleSubscription)
    private readonly hotelModuleSubscriptionRepo: Repository<HotelModuleSubscription>,
  ) {}

  private parseDateMaybe(input?: string): Date | null {
    if (!input) return null;
    const d = new Date(input);
    if (isNaN(d.getTime()))
      throw new BadRequestException('Ngày giờ không hợp lệ (expires_at)');
    return d;
  }

  async findAll(
    user: IUser,
    query?: {
      hotel_id?: string;
      module_code?: HotelModuleCode;
      status?: SubscriptionStatus;
    },
  ) {
    const where: FindOptionsWhere<HotelModuleSubscription> = {};

    if (user.role === Role.ADMIN) {
      if (query?.hotel_id) where.hotel_id = query.hotel_id;
      if (query?.module_code) where.module_code = query.module_code;
      if (query?.status) where.status = query.status;
      return this.hotelModuleSubscriptionRepo.find({
        where,
        order: { updated_at: 'DESC' },
      });
    }

    throw new ForbiddenException(
      'Bạn không có quyền xem danh sách đăng ký module',
    );
  }

  async findOne(id: string, user: IUser) :Promise<HotelModuleSubscription> {
    const sub = await this.hotelModuleSubscriptionRepo.findOne({
      where: { id },
    });
    if (!sub) throw new NotFoundException('Không tìm thấy đăng ký module');
    if (user.role === Role.ADMIN) {
      return sub;
    }
  }

  async update(id: string, dto: UpdateHotelModuleSubscriptionDto, user: IUser) {
    const sub = await this.hotelModuleSubscriptionRepo.findOne({
      where: { id },
    });
    if (!sub) throw new NotFoundException('Không tìm thấy đăng ký module');

    if (user.role === Role.ADMIN) {
      (dto as any).hotel_id && delete (dto as any).hotel_id;
      (dto as any).module_code && delete (dto as any).module_code;
      if (dto.status === SubscriptionStatus.PENDING) {
        sub.started_at = new Date();
        sub.is_active = true;
        return this.hotelModuleSubscriptionRepo.save(sub);
      }
      if (dto.status === SubscriptionStatus.SUSPENDED) {
        sub.is_active = false;
        sub.suspended_at = new Date();
        return this.hotelModuleSubscriptionRepo.save(sub);
      }
    }
  }
}
