import { Module } from '@nestjs/common';
import { AiModerationService } from './ai-moderation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelImage } from 'src/hotels/entities/hotel-image.entity';
import { RoomTypeImage } from 'src/room-types/entities/room-type-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HotelImage, RoomTypeImage]),
  ],
  providers: [AiModerationService],
  exports: [AiModerationService],
})
export class AiModerationModule {}