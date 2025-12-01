import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from 'src/locations/entities/province.entity';
import { District } from 'src/locations/entities/district.entity';
import { Ward } from 'src/locations/entities/ward.entity';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';
import { Inventory } from 'src/inventories/entities/inventory.entity';
import { RatePlan } from 'src/rate-plans/entities/rate-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Province,
      District,
      Ward,
      Hotel,
      RoomType,
      Inventory,
      RatePlan
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
