import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fetch from 'node-fetch';
import {
  HotelImage,
  ImageStatus,
} from 'src/hotels/entities/hotel-image.entity';
import { RoomTypeImage } from 'src/room-types/entities/room-type-image.entity';

export type AiScanResult = {
  isHotelRoom: boolean;
  confidence: number;
  labels: Record<string, number>;
};

@Injectable()
export class AiModerationService {
  private readonly AI_URL = 'http://localhost:8080/scan';

  constructor(
    @InjectRepository(HotelImage)
    private readonly hotelImageRepo: Repository<HotelImage>,
    @InjectRepository(RoomTypeImage)
    private readonly roomTypeImageRepo: Repository<RoomTypeImage>,
  ) {}

  async scanHotelImage(image: HotelImage, publicUrl: string) {
    const ai = await this.callAi(publicUrl);

    if (this.isFlagged(ai)) {
      image.status = ImageStatus.AI_FLAGGED;
    } else {
      image.status = ImageStatus.APPROVED;
    }

    await this.hotelImageRepo.save(image);
  }

  async scanRoomTypeImage(image: RoomTypeImage, publicUrl: string) {
    const ai = await this.callAi(publicUrl);

    if (this.isFlagged(ai)) {
      image.status = ImageStatus.AI_FLAGGED;
    } else {
      image.status = ImageStatus.APPROVED;
    }

    await this.roomTypeImageRepo.save(image);
  }
 
  private async callAi(imageUrl: string) {
    const resp = await fetch(this.AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!resp.ok) {
      throw new Error('AI service error');
    }

    return (await resp.json()) as any;
  }

  private isFlagged(ai: any): boolean {
    if (!ai.isHotelRoom) return true;
    if (ai.confidence < 0.4) return true;
    return false;
  }
}
