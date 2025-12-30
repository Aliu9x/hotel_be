import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, RegisterUserDTo } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { SignupMethod, User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync } from 'bcryptjs';
import { IUser, Role } from 'src/interfaces/customize.interface';
import { HotelMember } from 'src/hotel-members/entities/hotel-member.entity';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const saltRounds = 10;
    const hash = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepo.create({
      password: hash,
      full_name: dto.full_name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      role: dto.role ?? Role.CUSTOMER,
    });

    const saved = await this.userRepo.save({
      ...user,
      signup_method: SignupMethod.ADMIN_CREATED,
    });
    return saved;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) throw new ConflictException('Email đã tồn tại');
    }
    // if (dto.phone && dto.phone !== user.phone) {
    //   const existingPhone = await this.userRepo.findOne({ where: { phone: dto.phone } });
    //   if (existingPhone) throw new ConflictException('Số điện thoại đã tồn tại');
    // }

    if (dto.full_name != null) user.full_name = dto.full_name;
    if (dto.email != null) user.email = dto.email ?? null;
    if (dto.phone != null) user.phone = dto.phone ?? null;
    if (dto.role != null) user.role = dto.role;
    if (dto.status != null) user.status = dto.status;

    const saved = await this.userRepo.save(user);
    return saved;
  }

  async list(params: ListUsersDto): Promise<{
    result: Omit<User, 'password'>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, q, role } = params;

    const qb = this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.full_name',
        'u.email',
        'u.phone',
        'u.role',
        'u.status',
        'u.signup_method',
        'u.created_at',
        'u.updatedAt',
      ]);

    if (role) {
      qb.andWhere('u.role = :role', { role });
    }

    if (q) {
      const qLike = `%${q}%`;
      qb.andWhere(
        '(LOWER(u.full_name) LIKE LOWER(:q) OR LOWER(u.email) LIKE LOWER(:q) OR u.phone LIKE :q)',
        { q: qLike },
      );
    }

    qb.orderBy('u.created_at', 'DESC');

    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();

    return { result: rows as Omit<User, 'password'>[], total, page, limit };
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
