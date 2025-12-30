import { Module } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { RoomTypesController } from './room-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType } from './entities/room-type.entity';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomTypeImage } from './entities/room-type-image.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { RoomTypeCategory } from 'src/room-type-category/entities/room-type-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoomType,
      RoomTypeImage,
      Hotel,
      Inventory,
      RoomTypeCategory,
    ]),
  ],
  controllers: [RoomTypesController],
  providers: [RoomTypesService],
  exports: [RoomTypesService],
})
export class RoomTypesModule {}
