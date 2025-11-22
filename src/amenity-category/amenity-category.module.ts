import { Module } from '@nestjs/common';
import { AmenityCategoryService } from './amenity-category.service';
import { AmenityCategoryController } from './amenity-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmenityCategory } from './entities/amenity-category.entity';
import { Amenity } from './entities/amenity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity, AmenityCategory])],
  controllers: [AmenityCategoryController],
  providers: [AmenityCategoryService],
})
export class AmenityCategoryModule {}
