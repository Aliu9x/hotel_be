import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAmenityMappingDto } from './dto/create-amenity-mapping.dto';
import { UpdateAmenityMappingDto } from './dto/update-amenity-mapping.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AmenityEntityType,
  AmenityMapping,
} from './entities/amenity-mapping.entity';
import { In, Repository } from 'typeorm';
import { Amenity, AmenityApplyTo } from 'src/amenity/entities/amenity.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { IUser } from 'src/interfaces/customize.interface';

@Injectable()
export class AmenityMappingsService {
  constructor(
    @InjectRepository(AmenityMapping)
    private readonly repo: Repository<AmenityMapping>,
    @InjectRepository(Amenity)
    private readonly amenityRepo: Repository<Amenity>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
  ) {}

  async create(
    dto: CreateAmenityMappingDto,
    user: IUser,
  ): Promise<AmenityMapping[]> {
    const entity_type = dto.entity_id
      ? AmenityEntityType.RoomType
      : AmenityEntityType.Hotel;

    if (entity_type === AmenityEntityType.RoomType) {
      const roomType = await this.roomTypeRepo.findOne({
        where: { id: dto.entity_id },
      });
      if (!roomType) {
        throw new NotFoundException('Loại phòng này không tồn tại');
      }

      if (roomType.hotel_id !== user.hotel_id) {
        throw new BadRequestException(
          'Loại phòng phải thuộc hotel được cung cấp',
        );
      }
    }
    const results: AmenityMapping[] = [];
    for (const amenityId of dto.amenity_ids) {
      const amenity = await this.amenityRepo.findOne({
        where: { id: amenityId },
      });
      if (!amenity) {
        throw new NotFoundException(`Tiện ích ${amenityId} không tồn tại`);
      }
      const existing = await this.repo.findOne({
        where: {
          entity_type,
          entity_id: dto.entity_id ?? user.hotel_id,
          amenity_id: amenityId,
        },
      });
      if (!existing) {
        existing.value = dto.value ?? existing.value ?? null;
        existing.notes = dto.notes ?? existing.value ?? null;
        results.push(await this.repo.save(existing));
      }
      const newMapping = this.repo.create({
        hotel_id: user.hotel_id,
        entity_type,
        entity_id: dto.entity_id ?? user.hotel_id,
        amenity_id: amenityId,
        value: dto.value ?? null,
        notes: dto.notes ?? null,
      });
      results.push(await this.repo.save(newMapping));
    }
    return results;
  }
  async findAvailableAmenities(params: {
  hotel_id: string;
  entity_type: AmenityEntityType;
  entity_id?: string;
}) {
  const { hotel_id, entity_type, entity_id } = params;

  const applies_to =
    entity_type === AmenityEntityType.Hotel
      ? [AmenityApplyTo.Hotel, AmenityApplyTo.Both]
      : [AmenityApplyTo.RoomType, AmenityApplyTo.Both];

  const amenities = await this.amenityRepo.find({
    where: { applies_to: In(applies_to), is_active: true },
    order: { name: 'ASC' },
  });

  const mappings = await this.repo.find({
    where: {
      entity_type,
      entity_id: entity_type === AmenityEntityType.Hotel ? hotel_id : entity_id,
    },
  });

 
  return amenities.map((a) => {
    const found = mappings.find((m) => m.amenity_id === a.id);
    return {
      id: a.id,
      name: a.name,
      category: a.category,
      applies_to: a.applies_to,
      value: found?.value ?? null,
      notes: found?.notes ?? null,
    };
  });
}


  async updateAmenities(
  dto: CreateAmenityMappingDto,
  user: IUser,
): Promise<AmenityMapping[]> {
  const entity_type = dto.entity_id
    ? AmenityEntityType.RoomType
    : AmenityEntityType.Hotel;

  if (entity_type === AmenityEntityType.RoomType) {
    const roomType = await this.roomTypeRepo.findOne({
      where: { id: dto.entity_id },
    });
    if (!roomType) throw new NotFoundException('Loại phòng này không tồn tại');
    if (roomType.hotel_id !== user.hotel_id)
      throw new BadRequestException('Loại phòng không thuộc về khách sạn');
  }

  const entity_id = dto.entity_id ?? user.hotel_id;

  const existingMappings = await this.repo.find({
    where: { entity_type, entity_id },
  });
  const existingIds = existingMappings.map((m) => m.amenity_id);

  const toAdd = dto.amenity_ids.filter((id) => !existingIds.includes(id));

  const toRemove = existingIds.filter((id) => !dto.amenity_ids.includes(id));

  if (toRemove.length > 0) {
    await this.repo.delete({
      entity_type,
      entity_id,
      amenity_id: In(toRemove),
    });
  }

  const newMappings = toAdd.map((amenity_id) =>
    this.repo.create({
      hotel_id: user.hotel_id,
      entity_type,
      entity_id,
      amenity_id,
      value: dto.value ?? null,
      notes: dto.notes ?? null,
    }),
  );

  if (newMappings.length > 0) {
    await this.repo.save(newMappings);
  }

  const updated = await this.repo.find({
    where: { entity_type, entity_id },
    relations: ['amenity'],
  });

  return updated;
}

}
