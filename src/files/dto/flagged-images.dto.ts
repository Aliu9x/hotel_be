import { IsIn, IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ImageStatus } from 'src/hotels/entities/hotel-image.entity';

export class FlaggedImagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(1000)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['hotel', 'roomType'])
  type?: 'hotel' | 'roomType';
}

export class UpdateImageStatusDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}
export type FlaggedHotelImage = {
  type: 'HOTEL_IMAGE';
  image_id: string;
  file_name: string;
  is_cover: boolean;
  status: ImageStatus;
  created_at: Date;
  hotel: {
    id: string;
    name: string;
    address_line?: string;
    star_rating?: number;
    province_name?: string;
    district_name?: string;
    ward_name?: string;
  };
};

export type FlaggedRoomTypeImage = {
  type: 'ROOM_TYPE_IMAGE';
  image_id: string;
  file_name: string;
  is_cover: boolean;
  status: ImageStatus;
  created_at: Date;
  hotel: {
    id: string;
    name: string;
    address_line?: string;
    star_rating?: number;
    province_name?: string;
    district_name?: string;
    ward_name?: string;
  };
  room_type: {
    id: string;
    name: string;
    description?: string;
    capacity?: number;
    bed_config?: string;
  };
};
