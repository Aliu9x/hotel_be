import { Module } from '@nestjs/common';
import { RoomTypeCategoryService } from './room-type-category.service';
import { RoomTypeCategoryController } from './room-type-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeCategory } from './entities/room-type-category.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RoomTypeCategory])],
  controllers: [RoomTypeCategoryController],
  providers: [RoomTypeCategoryService],
})
export class RoomTypeCategoryModule {}
