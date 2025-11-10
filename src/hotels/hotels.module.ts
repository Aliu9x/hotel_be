import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { User } from 'src/users/entities/user.entity';
import { HotelModuleSubscription } from 'src/hotel-module-subscriptions/entities/hotel-module-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel,User,HotelModuleSubscription])],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [TypeOrmModule, HotelsService],
})
export class HotelsModule {}
