import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmenityCategory } from './entities/amenity-category.entity';
import { Amenity } from 'src/amenity-category/entities/amenity.entity';
import { CreateAmenityCategoryDto } from './dto/create-amenity-category.dto';
import { UpdateAmenityCategoryDto } from './dto/update-amenity-category.dto';
import { ListCategoriesDto } from './dto/list-categories.dto';

@Injectable()
export class AmenityCategoryService {
  constructor(
    @InjectRepository(AmenityCategory)
    private categoryRepo: Repository<AmenityCategory>,
    @InjectRepository(Amenity)
    private amenityRepo: Repository<Amenity>,
  ) {}

  async create(createDto: CreateAmenityCategoryDto) {
    const category = this.categoryRepo.create({
      name_category: createDto.category, 
      applies_to: createDto.applies_to,
      is_active: createDto.is_active ?? true,
    });

    const savedCategory = await this.categoryRepo.save(category);
    const amenities = createDto.amenities.map((item) =>
      this.amenityRepo.create({
        name: item.name,
        category: savedCategory,
      }),
    );

    await this.amenityRepo.save(amenities);
    return this.categoryRepo.findOne({
      where: { id: savedCategory.id },
      relations: ['amenities'],
    });
  }

  async findAllType(applies_to?: string) {
    const qb = this.categoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.amenities', 'amenities');

    if (applies_to) qb.where('category.applies_to = :a', { a: applies_to });

    return qb.orderBy('category.created_at', 'DESC').getMany();
  }
  async findAll(query: ListCategoriesDto) {
    const {
      q,
      applies_to,
      page = 1,
      limit = 10,
      orderBy = 'created_at',
      order = 'DESC',
    } = query;

    const qb = this.categoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.amenities', 'amenities');
    if (applies_to) {
      qb.andWhere('category.applies_to = :applies_to', { applies_to });
    }
    if (q && q.trim()) {
      qb.andWhere(
        '(category.name_category LIKE :search OR amenities.name LIKE :search)',
        { search: `%${q.trim()}%` },
      );
    }
    const total = await qb.getCount();
    qb.orderBy(`category.${orderBy}`, order);
    const offset = (page - 1) * limit;
    qb.skip(offset).take(limit);
    const result = await qb.getMany();
    const pages = Math.ceil(total / limit);
    return {
      meta: {
        page,
        limit,
        pages,
        total,
      },
      result,
    };
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['amenities'],
    });
    if (!category) throw new NotFoundException('Loại tiện ích không tồn tại');
    return category;
  }

  async update(id: string, updateDto: UpdateAmenityCategoryDto) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['amenities'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    category.name_category = updateDto.category;
    category.applies_to = updateDto.applies_to;
    category.is_active = updateDto.is_active ?? category.is_active;

    await this.categoryRepo.save(category);
    const existingAmenityIds = category.amenities.map((a) => a.id);

    const updateAmenityIds = updateDto.amenities
      .filter((a) => a.id)
      .map((a) => a.id!);

    const amenitiesToDelete = existingAmenityIds.filter(
      (id) => !updateAmenityIds.includes(id),
    );

    if (amenitiesToDelete.length > 0) {
      await this.amenityRepo.delete(amenitiesToDelete);
    }

    for (const amenityDto of updateDto.amenities) {
      if (amenityDto.id) {
        await this.amenityRepo.update(amenityDto.id, {
          name: amenityDto.name,
        });
      } else {
        const newAmenity = this.amenityRepo.create({
          name: amenityDto.name,
          category: category,
        });
        await this.amenityRepo.save(newAmenity);
      }
    }

    return this.categoryRepo.findOne({
      where: { id },
      relations: ['amenities'],
    });
  }

  async delete(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['amenities'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    await this.categoryRepo.remove(category);

    return { success: true };
  }
}
