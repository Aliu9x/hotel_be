import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAmenityMappingDto } from './dto/create-amenity-mapping.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AmenityMapping } from './entities/amenity-mapping.entity';
import { In, Repository } from 'typeorm';
import { IUser } from 'src/interfaces/customize.interface';

type MappedAmenityItem = {
  mapping_id: string;
  amenity_id: string;
  name: string;
};

type AmenityGroup = {
  category_id: string | null;
  category_name: string;
  amenities: MappedAmenityItem[];
};
@Injectable()
export class AmenityMappingsService {
  constructor(
    @InjectRepository(AmenityMapping)
    private mappingRepo: Repository<AmenityMapping>,
  ) {}

  async createOrUpdate(dto: CreateAmenityMappingDto, user: IUser) {
    await this.mappingRepo.delete({
      hotel_id: user.hotel_id,
      room_type_id: dto.room_type_id ?? null,
    });

    const newMappings = dto.amenity_ids.map((amenity_id) =>
      this.mappingRepo.create({
        hotel_id: user.hotel_id,
        room_type_id: dto.room_type_id ?? null,
        amenity_id,
      }),
    );

    return await this.mappingRepo.save(newMappings);
  }

  async getMappingsGrouped(
    user: IUser,
    room_type_id?: string,
  ): Promise<AmenityGroup[]> {
    const where: any = {
      hotel_id: user.hotel_id,
      room_type_id: room_type_id ?? null,
    };
    const rows = await this.mappingRepo.find({
      where,
      relations: ['amenity', 'amenity.category'],
    });
    const groupsMap = new Map<string, AmenityGroup>();
    for (const r of rows) {
      const cat = r?.amenity?.category;
      const catId = cat?.id as string;
      const catName = (cat?.name_category ?? cat?.name_category) as string;

      if (!groupsMap.has(catId)) {
        groupsMap.set(catId, {
          category_id: cat?.id ?? null,
          category_name: catName,
          amenities: [],
        });
      }

      groupsMap.get(catId)!.amenities.push({
        mapping_id: r.id,
        amenity_id: r.amenity_id,
        name: r.amenity?.name ?? '',
      });
    }

    const groups = Array.from(groupsMap.values());

    return groups;
  }
  async getMappingsGroupedHotel(id: string): Promise<AmenityGroup[]> {

    const rows = await this.mappingRepo.find({
      where: { hotel_id: id },
      relations: ['amenity', 'amenity.category'],
    });

    const groupsMap = new Map<string, AmenityGroup>();
    for (const r of rows) {
      const cat = r?.amenity?.category;
      const catId = cat?.id as string;
      const catName = (cat?.name_category ?? cat?.name_category) as string;

      if (!groupsMap.has(catId)) {
        groupsMap.set(catId, {
          category_id: cat?.id ?? null,
          category_name: catName,
          amenities: [],
        });
      }

      groupsMap.get(catId)!.amenities.push({
        mapping_id: r.id,
        amenity_id: r.amenity_id,
        name: r.amenity?.name ?? '',
      });
    }

    const groups = Array.from(groupsMap.values());

    return groups;
  }
}
