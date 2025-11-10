import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHotelMemberDto } from './dto/create-hotel-member.dto';
import { UpdateHotelMemberDto } from './dto/update-hotel-member.dto';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelMember } from './entities/hotel-member.entity';

@Injectable()
export class HotelMembersService {
  constructor(
    @InjectRepository(HotelMember)
    private readonly hotelMemberRepo: Repository<HotelMember>,
  ) {}

  public checkRole(hotelId: string, user: IUser) {
    if (user.role === Role.ADMIN) return;
    if (
      user.role === Role.HOTEL_OWNER &&
      user.hotel_id &&user.hotel_id === hotelId
    )
      return;
    throw new ForbiddenException('Bạn không có quyền trong khách sạn này');
  }
  create(createHotelMemberDto: CreateHotelMemberDto) {
    return 'This action adds a new hotelMember';
  }

  async findAll(user: IUser, query?: { hotel_id?: string; user_id?: string }) {
    const where: FindOptionsWhere<HotelMember> = {};

    if (user.role === Role.ADMIN) {
      if (query?.hotel_id) where.hotel_id = query.hotel_id;
      if (query?.user_id) where.user_id = query.user_id;
      return this.hotelMemberRepo.find({
        where,
        order: { created_at: 'DESC' },
      });
    }

    if (user.role === Role.HOTEL_OWNER) {
      if (!user.hotel_id)
        throw new ForbiddenException('Không xác định được khách sạn của bạn');
      where.hotel_id = user.hotel_id;
      return this.hotelMemberRepo.find({
        where,
        order: { created_at: 'DESC' },
      });
    }
  }

  async findOne(id: string, user: IUser) {
    const member = await this.hotelMemberRepo.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('Không tìm thấy thành viên ');
    }
    if (user.role === Role.ADMIN) {
      return member;
    }
    if (user.role === Role.HOTEL_OWNER) {
      if (user.hotel_id !== member.hotel_id || !user.hotel_id) {
        throw new ForbiddenException('Không có quyền truy cập thành viên này');
      }
      return member;
    }
    if (member.user_id !== user.id) {
      throw new ForbiddenException('Không có quyền truy cập thành viên này');
    }
    return member;
  }

  async update(id: string, dto: UpdateHotelMemberDto, user: IUser) {
    const member = await this.hotelMemberRepo.findOne({ where: { id } });

    if (!member) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }
    this.checkRole(member.hotel_id, user);

    const toSave = this.hotelMemberRepo.merge(member, {
      is_active: dto.is_active ?? member.is_active,
    });
    return this.hotelMemberRepo.save(toSave);
  }

  async remove(id: string, user: IUser) {
    const member = await this.hotelMemberRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Không tìm thấy thành viên');

    this.checkRole(member.hotel_id, user);

    await this.hotelMemberRepo.remove(member);
    return { success: true };
  }
}
