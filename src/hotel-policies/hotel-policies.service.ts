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

  async demo(user: IUser) {
    console.log('user trong service:', user);
  }

  async create(dto: CreateHotelPolicyDto, user: IUser) {
    if (!(user.role === Role.ADMIN || user.role === Role.HOTEL_OWNER)) {
      throw new ForbiddenException(
        'Bạn không có quyền tạo chính sách hiển thị',
      );
    }

    const hotelId = user.role === Role.ADMIN ? dto.hotel_id : user.hotel_id;
    if (!hotelId) throw new BadRequestException('Thiếu hotel_id');

    this.hotelMemberService.checkRole(hotelId, user);

    const hotel = await this.hotelsRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('Không tìm thấy khách sạn');

    const existed = await this.hotelPolicyRepo.findOne({
      where: { hotel_id: hotelId },
    });
    if (existed)
      throw new BadRequestException('Khách sạn đã có chính sách hiển thị');

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

    return this.hotelPolicyRepo.save(entity);
  }

  async findAll(user: IUser, query?: { hotel_id?: string }) {
    if (user.role === Role.ADMIN) {
      const where: FindOptionsWhere<HotelPolicy> = {};
      if (query?.hotel_id) where.hotel_id = query.hotel_id;
      return this.hotelPolicyRepo.find({
        where,
        order: { updated_at: 'DESC' },
      });
    }
    if (user.role === Role.HOTEL_OWNER) {
      if (!user.hotel_id)
        throw new ForbiddenException('Không xác định được khách sạn của bạn');
      return this.hotelPolicyRepo.find({
        where: { hotel_id: user.hotel_id },
        order: { updated_at: 'DESC' },
      });
    }
  }

  async findOne(id: string, user: IUser) {
    const policy = await this.hotelPolicyRepo.findOne({ where: { id } });
    if (!policy)
      throw new NotFoundException('Không tìm thấy chính sách hiển thị');
    if (user.role === Role.HOTEL_OWNER && user.hotel_id === policy.hotel_id) {
      return policy;
    }
  }

  async update(id: string, dto: UpdateHotelPolicyDto, user: IUser) {
    const policy = await this.hotelPolicyRepo.findOne({ where: { id } });
    if (!policy)
      throw new NotFoundException('Không tìm thấy chính sách hiển thị');

    if (user.role === Role.HOTEL_OWNER && user.hotel_id === policy.hotel_id) {
      (dto as any).hotel_id && delete (dto as any).hotel_id;

      const merged = this.hotelPolicyRepo.merge(policy, dto);
      return this.hotelPolicyRepo.save(merged);
    }
  }
}
