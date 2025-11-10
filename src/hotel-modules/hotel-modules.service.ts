import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateHotelModuleDto } from './dto/create-hotel-module.dto';
import { UpdateHotelModuleDto } from './dto/update-hotel-module.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelModule, HotelModuleCode } from './entities/hotel-module.entity';
import { Repository } from 'typeorm';
import { IUser, Role } from 'src/interfaces/customize.interface';

@Injectable()
export class HotelModulesService {
  constructor(
    @InjectRepository(HotelModule)
    private readonly modulesRepo: Repository<HotelModule>,
  ) {}

  async create(dto: CreateHotelModuleDto, user: IUser) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền tạo module này');
    }
    const existed = await this.modulesRepo.findOne({
      where: { module_code: dto.code },
    });
    if (existed) {
      throw new BadRequestException('Mã module (code) đã tồn tại');
    }

    const entity = this.modulesRepo.create({
      module_code: dto.code ?? HotelModuleCode.BILLING,
      name: dto.name,
      description: dto.description ?? null,
      is_published: dto.is_published ?? false,
    });

    return this.modulesRepo.save(entity);
  }

  async findAll() {
    const list = await this.modulesRepo.find({ order: { module_code: 'ASC' } });
    return list;
  }

  async findOne(id: string) {
    const module = await this.modulesRepo.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Không tìm thấy module');
    if (!module.is_published) {
      throw new ForbiddenException('Module chưa được công bố');
    }
    return module;
  }

  async update(
    id: string,
    dto: { name?: string; description?: string; is_published?: boolean },
    user: IUser,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền tạo module này');
    }
    const module = await this.modulesRepo.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Không tìm thấy module');

    (dto as any).code && delete (dto as any).code;

    const merged = this.modulesRepo.merge(module, dto);
    return this.modulesRepo.save(merged);
  }

  async remove(id: string, user: IUser) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền tạo module này');
    }

    const mod = await this.modulesRepo.findOne({ where: { id } });
    if (!mod) throw new NotFoundException('Không tìm thấy module');

    await this.modulesRepo.remove(mod);
    return { success: true };
  }
}
