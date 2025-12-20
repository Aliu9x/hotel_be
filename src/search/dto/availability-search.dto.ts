import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  ValidateIf,
  IsBoolean,
  IsNumber,
  ArrayUnique,
} from 'class-validator';

export enum DestinationType {
  HOTEL = 'hotel',
  PROVINCE = 'province',
  DISTRICT = 'district',
  WARD = 'ward',
}

export class AvailabilitySearchDto {
  @IsDateString()
  checkin: string;

  @IsDateString()
  checkout: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rooms: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  children: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  hotelId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  provinceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  wardId?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  hotelAmenityIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  roomAmenityIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minStar?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxStar?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  refundableOnly?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  payAtHotelOnly?: boolean;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortPrice?: 'asc' | 'desc' = 'desc';
}

export interface RoomTypeAvailability {
  room_type_id: number;
  name: string;
  description?: string;
  capacity: {
    max_adults: number;
    max_children: number;
    max_occupancy: number;
  };
  bed_config: string;
  room_size_label?: string;
  floor_level: string;
  smoking_allowed: boolean;
  view: string;
  total_rooms: number;
  can_fulfill: boolean;
  avg_price?: number;
  best_price?: number;
}

export interface HotelAvailability {
  hotel_id: number;
  hotel_name: string;
  star_rating?: number;
  address_line?: string;
  province?: string;
  district?: string;
  ward?: string;
  hotel_min_price?: number;
  matched_room_types: RoomTypeAvailability[];
  images: string[];
}

export interface AvailabilityResponse {
  meta: {
    checkin: string;
    checkout: string;
    nights: number;
    requested_rooms: number;
    adults: number;
    children: number;
    total_guests: number;
  };
  hotels: HotelAvailability[];
}
