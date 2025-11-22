import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeImage } from 'src/room-types/entities/room-type-image.entity';
import { HotelImage } from 'src/hotels/entities/hotel-image.entity';

@Module({
  imports: [
    MulterModule.registerAsync({ useClass: MulterConfigService }),
    TypeOrmModule.forFeature([RoomTypeImage, HotelImage]),
  ],
  controllers: [FilesController],
  providers: [FilesService, MulterConfigService],
})
export class FilesModule {}
