import { Module } from '@nestjs/common';
import { HotelModulesService } from './hotel-modules.service';
import { HotelModulesController } from './hotel-modules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelModule } from './entities/hotel-module.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HotelModule,])],
  controllers: [HotelModulesController],
  providers: [HotelModulesService],
  exports: [TypeOrmModule, HotelModulesService],
})
export class HotelModulesModule {}
