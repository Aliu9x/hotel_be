import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto, RegisterUserDTo } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignupMethod, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync } from 'bcryptjs';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { HotelMember } from 'src/hotel-members/entities/hotel-member.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(HotelMember)
    private hotelMemberRepo: Repository<HotelMember>,
  ) {}

  async create(dto: CreateUserDto, users: IUser) {
    if (users.role !== 'ADMIN' && users.role !== 'HOTEL_OWNER') {
      throw new ForbiddenException('Bạn không có quyền tạo người dùng');
    }

    if (dto.email) {
      const existedByEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existedByEmail)
        throw new BadRequestException('Email đã được sử dụng');
    }

    let roleToAssign: Role;
    let signupMethod: SignupMethod;

    if (users.role === 'ADMIN') {
      if (!dto.role)
        throw new BadRequestException(
          'ADMIN phải chỉ định role khi tạo người dùng',
        );
      roleToAssign = dto.role;
      signupMethod = SignupMethod.ADMIN_CREATED;

      if (
        [Role.HOTEL_OWNER, Role.HOTEL_STAFF].includes(roleToAssign) &&
        !dto.hotelId
      ) {
        throw new BadRequestException(
          'Phải chỉ định khách sạn cho vai trò này',
        );
      }
    } else {
      roleToAssign = Role.HOTEL_STAFF;
      signupMethod = SignupMethod.INVITED;

      if (!users.hotel_id)
        throw new ForbiddenException(
          'Tài khoản của bạn không thuộc khách sạn nào',
        );

      if (dto.hotelId && dto.hotelId !== users.hotel_id)
        throw new ForbiddenException(
          'Bạn chỉ có thể tạo nhân viên trong khách sạn của mình',
        );

      dto.hotelId = users.hotel_id;
    }

    const user = this.userRepo.create({
      full_name: dto.full_name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      password: dto.password,
      role: roleToAssign,
      signup_method: signupMethod,
      created_by_user_id: users.id,
    });

    const savedUser = await this.userRepo.save(user);

    if (
      dto.hotelId &&
      [Role.HOTEL_OWNER, Role.HOTEL_STAFF].includes(roleToAssign)
    ) {
      await this.hotelMemberRepo.save({
        hotel_id: dto.hotelId,
        user_id: savedUser.id,
        added_by_user_id: users.id,
        is_active: true,
      });
    }

    return savedUser;
  }

  async register(dto: RegisterUserDTo) {
    if (dto.email) {
      const existedByEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existedByEmail) {
        throw new BadRequestException('Email đã được sử dụng');
      }
    }
    const user = this.userRepo.create({
      full_name: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: dto.role ?? Role.CUSTOMER,
    });
    return this.userRepo.save(user);
  }
  // async findAll(current: CurrentUser) {
  //   if (current.role === 'ADMIN') {
  //     return this.usersRepo.find({ order: { created_at: 'DESC' } });
  //   }

  //   if (current.role === 'HOTEL_OWNER') {
  //     // Tạm thời: liệt kê các user do chủ KS mời/tạo
  //     return this.usersRepo.find({
  //       where: { created_by_user_id: current.id },
  //       order: { created_at: 'DESC' },
  //     });
  //   }

  //   // CUSTOMER / HOTEL_STAFF: chỉ thấy chính mình
  //   const me = await this.usersRepo.findOne({ where: { id: current.id } });
  //   return me ? [me] : [];
  // }

  // async findOne(id: string, current: CurrentUser) {
  //   const user = await this.usersRepo.findOne({ where: { id } });
  //   if (!user) throw new NotFoundException('Không tìm thấy người dùng');

  //   if (current.role === 'ADMIN') return user;

  //   if (current.role === 'HOTEL_OWNER') {
  //     // Chủ KS xem: user do mình tạo hoặc chính mình
  //     if (user.created_by_user_id === current.id || user.id === current.id) {
  //       return user;
  //     }
  //     throw new ForbiddenException('Không có quyền truy cập người dùng này');
  //   }

  //   // CUSTOMER/HOTEL_STAFF: chỉ xem chính mình
  //   if (user.id !== current.id) {
  //     throw new ForbiddenException('Không có quyền truy cập người dùng này');
  //   }
  //   return user;
  // }

  // async update(id: string, dto: UpdateUserDto, current: CurrentUser) {
  //   const user = await this.usersRepo.findOne({ where: { id } });
  //   if (!user) throw new NotFoundException('Không tìm thấy người dùng');

  //   // Phân quyền cập nhật
  //   const isSelf = user.id === current.id;

  //   if (current.role === 'ADMIN') {
  //     // OK
  //   } else if (current.role === 'HOTEL_OWNER') {
  //     // Chủ KS chỉ cập nhật user do mình tạo hoặc chính mình
  //     if (!(user.created_by_user_id === current.id || isSelf)) {
  //       throw new ForbiddenException('Không có quyền cập nhật người dùng này');
  //     }
  //     // Không được nâng quyền khác HOTEL_STAFF
  //     if (dto.role && dto.role !== Role.HOTEL_STAFF) {
  //       throw new ForbiddenException('HOTEL_OWNER chỉ có thể đặt role = HOTEL_STAFF cho nhân sự');
  //     }
  //   } else {
  //     // CUSTOMER/HOTEL_STAFF: chỉ tự cập nhật, và không thay đổi role
  //     if (!isSelf) {
  //       throw new ForbiddenException('Không có quyền cập nhật người dùng này');
  //     }
  //     if (dto.role) {
  //       throw new ForbiddenException('Bạn không có quyền thay đổi vai trò');
  //     }
  //   }

  //   // Không cho phép đổi username qua endpoint này (nếu client gửi thì bỏ)
  //   (dto as any).username && delete (dto as any).username;

  //   // Validate unique email khi đổi
  //   if (dto.email && dto.email !== user.email) {
  //     const existed = await this.usersRepo.findOne({
  //       where: { email: dto.email, id: Not(id) },
  //     });
  //     if (existed) {
  //       throw new BadRequestException('Email đã được sử dụng');
  //     }
  //   }

  //   const toSave = this.usersRepo.merge(user, dto);
  //   return this.usersRepo.save(toSave);
  // }

  // async me(current: CurrentUser) {
  //   const me = await this.usersRepo.findOne({ where: { id: current.id } });
  //   if (!me) throw new NotFoundException('Không tìm thấy tài khoản hiện tại');
  //   return me;
  // }

  updateUserToken = async (refreshToken: string, id: string) => {
    return await this.userRepo.update(
      { id },
      {
        refreshToken,
      },
    );
  };

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email: username } });
  }

  async findUserByToken(refreshToken: string) {
    const user = await this.userRepo.findOne({
      where: { refreshToken },
    });

    if (!user) return null;

    user.lastLogin = new Date();

    return await this.userRepo.save(user);
  }
}
