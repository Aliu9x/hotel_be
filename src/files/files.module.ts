import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './multer.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeImage } from 'src/room-types/entities/room-type-image.entity';
import { HotelImage } from 'src/hotels/entities/hotel-image.entity';
import { AiModerationModule } from 'src/ai-moderation/ai-moderation.module';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { RoomType } from 'src/room-types/entities/room-type.entity';

@Module({
  imports: [
    MulterModule.registerAsync({ useClass: MulterConfigService }),
    TypeOrmModule.forFeature([RoomTypeImage, HotelImage,Hotel, RoomType]),AiModerationModule
  ],
  controllers: [FilesController],
  providers: [FilesService, MulterConfigService],
})
export class FilesModule {}
