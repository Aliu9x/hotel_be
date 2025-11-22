import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHotelPolicyDto } from './dto/create-hotel-policy.dto';
import { UpdateHotelPolicyDto } from './dto/update-hotel-policy.dto';
import { HotelPolicy } from './entities/hotel-policy.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { HotelMembersService } from 'src/hotel-members/hotel-members.service';
import { IUser, Role } from 'src/interfaces/customize.interface';

@Injectable()
export class HotelPoliciesService {
  constructor(
    @InjectRepository(HotelPolicy)
    private readonly hotelPolicyRepo: Repository<HotelPolicy>,
    @InjectRepository(Hotel)
    private readonly hotelsRepo: Repository<Hotel>,
    private readonly hotelMemberService: HotelMembersService,
  ) {}

  async createOrUpdate(dto: CreateHotelPolicyDto, user: IUser) {
    if (!(user.role === Role.ADMIN || user.role === Role.HOTEL_OWNER)) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác với chính sách khách sạn',
      );
    }

    const hotelId = user.role === Role.ADMIN ? dto.hotel_id : user.hotel_id;
    if (!hotelId) {
      throw new BadRequestException('Thiếu hotel_id');
    }

    await this.hotelMemberService.checkRole(hotelId, user);

    const hotel = await this.hotelsRepo.findOne({ where: { id: hotelId } });
    if (!hotel) {
      throw new NotFoundException('Không tìm thấy khách sạn');
    }

    const existed = await this.hotelPolicyRepo.findOne({
      where: { hotel_id: hotelId },
    });

    if (existed) {
      existed.default_checkin_time =
        dto.default_checkin_time ?? existed.default_checkin_time;
      existed.default_checkout_time =
        dto.default_checkout_time ?? existed.default_checkout_time;
      existed.house_rules = dto.house_rules ?? existed.house_rules;
      existed.children_policy = dto.children_policy ?? existed.children_policy;
      existed.smoking_policy = dto.smoking_policy ?? existed.smoking_policy;
      existed.pets_policy = dto.pets_policy ?? existed.pets_policy;
      existed.other_policies = dto.other_policies ?? existed.other_policies;

      return await this.hotelPolicyRepo.save(existed);
    } else {
      const entity = this.hotelPolicyRepo.create({
        hotel_id: hotelId,
        default_checkin_time: dto.default_checkin_time ?? null,
        default_checkout_time: dto.default_checkout_time ?? null,
        house_rules: dto.house_rules ?? null,
        children_policy: dto.children_policy ?? null,
        smoking_policy: dto.smoking_policy ?? null,
        pets_policy: dto.pets_policy ?? null,
        other_policies: dto.other_policies ?? null,
      });

      return await this.hotelPolicyRepo.save(entity);
    }
  }

  async findOne( user: IUser,hotelId?: string,): Promise<HotelPolicy> {
    const targetHotelId =
      user.role === Role.HOTEL_OWNER ? user.hotel_id : hotelId;

    if (!targetHotelId) {
      throw new BadRequestException('Thiếu hotelId để lấy chính sách.');
    }

    if (user.role === Role.HOTEL_OWNER && user.hotel_id !== targetHotelId) {
      throw new ForbiddenException(
        'Không có quyền truy cập chính sách khách sạn này.',
      );
    }

    const policy = await this.hotelPolicyRepo.findOne({
      where: { hotel_id: targetHotelId },
    });

    if (!policy) {
      throw new NotFoundException(
        'Chưa thiết lập chính sách cho khách sạn này.',
      );
    }

    return policy;
  }
}
