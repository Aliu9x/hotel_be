import { Module } from '@nestjs/common';
import { HotelModuleSubscriptionsService } from './hotel-module-subscriptions.service';
import { HotelModuleSubscriptionsController } from './hotel-module-subscriptions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelModuleSubscription } from './entities/hotel-module-subscription.entity';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { HotelModule } from 'src/hotel-modules/entities/hotel-module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelModuleSubscription, Hotel, HotelModule])],
  controllers: [HotelModuleSubscriptionsController],
  providers: [HotelModuleSubscriptionsService],
  exports: [TypeOrmModule, HotelModuleSubscriptionsService],
})
export class HotelModuleSubscriptionsModule {}
