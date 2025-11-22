import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Ward } from './entities/ward.entity';
import { ImportService } from './import.service';
import { AdminLocationsController } from './admin.locations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Province, District, Ward])],
  providers: [LocationsService, ImportService],
  controllers: [LocationsController, AdminLocationsController],
  exports: [LocationsService],
})
export class LocationsModule {}
