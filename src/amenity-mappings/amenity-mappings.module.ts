import { Module } from '@nestjs/common';
import { AmenityMappingsService } from './amenity-mappings.service';
import { AmenityMappingsController } from './amenity-mappings.controller';
import { AmenityMapping } from './entities/amenity-mapping.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from 'src/amenity/entities/amenity.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AmenityMapping, Amenity, RoomType])],
  controllers: [AmenityMappingsController],
  providers: [AmenityMappingsService],
})
export class AmenityMappingsModule {}
