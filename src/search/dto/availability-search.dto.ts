import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsArray,
  IsEnum,
  ValidateIf
} from 'class-validator';

export enum DestinationType {
  HOTEL = 'hotel',
  PROVINCE = 'province',
  DISTRICT = 'district',
  WARD = 'ward',
}

export class AvailabilitySearchDto {
  @IsDateString()
  checkin!: string; 

  @IsDateString()
  checkout!: string; 

  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  children!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rooms!: number;

  @IsOptional() @Type(() => Number) @IsInt() provinceId?: number;
  @IsOptional() @Type(() => Number) @IsInt() districtId?: number;
  @IsOptional() @Type(() => Number) @IsInt() wardId?: number;
  @IsOptional() @Type(() => Number) hotelId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) starMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) starMax?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceMin?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceMax?: number;

  @IsOptional() @IsArray() @Type(() => Number)
  amenityIds?: number[];

  @IsOptional() @IsString()
  q?: string;
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
  total_rooms: number;
  can_fulfill: boolean;
  avg_price?: number;              
}

export interface HotelAvailability {
  hotel_id: number;
  hotel_name: string;
  star_rating?: number;
  address_line?: string;
  province?: string;
  district?: string;
  ward?: string;
  matched_room_types: RoomTypeAvailability[];
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