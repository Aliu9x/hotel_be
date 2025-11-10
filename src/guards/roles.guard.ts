import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { ROLES_KEY } from 'src/decorator/customize';
import { Role } from 'src/interfaces/customize.interface';
import { Repository } from 'typeorm';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    //@InjectRepository(HotelMember)
    //private readonly hotelMemberRepo: Repository<HotelMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) throw new ForbiddenException('Bạn chưa đăng nhập.');

    //if (user.role !== Role.HOTEL_STAFF) return true;

    // const member = await this.hotelMemberRepo.findOne({
    //   where: { user_id: user.sub, is_active: true },
    // });

    // if (!member) {
    //   throw new ForbiddenException(
    //     'Nhân viên này đã bị vô hiệu hóa cần liên hệ chủ khách sạn ',
    //   );
    // }

    return true;
  }
}
