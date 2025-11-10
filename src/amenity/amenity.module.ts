import { Module } from '@nestjs/common';
import { AmenityService } from './amenity.service';
import { AmenityController } from './amenity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './entities/amenity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity])],

  controllers: [AmenityController],
  providers: [AmenityService],
  exports: [TypeOrmModule, AmenityService],
})
export class AmenityModule {}
