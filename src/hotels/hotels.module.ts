import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { User } from 'src/users/entities/user.entity';
import { Province } from 'src/locations/entities/province.entity';
import { District } from 'src/locations/entities/district.entity';
import { Ward } from 'src/locations/entities/ward.entity';
import { HotelImage } from './entities/hotel-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel, User, Province, District, Ward,HotelImage])],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [ HotelsService],
})
export class HotelsModule {}
