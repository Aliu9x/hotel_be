import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HotelRoomTypesQueryDto {
  @IsInt() @Type(() => Number) hotelId!: number;
  @IsDateString() checkin!: string;
  @IsDateString() checkout!: string;
  @IsInt() @Type(() => Number) @Min(1) adults!: number;
  @IsInt() @Type(() => Number) @Min(0) children!: number;
  @IsInt() @Type(() => Number) @Min(1) rooms!: number;
}

export interface HotelRoomTypeDaily {
  date: string;
  total_rooms: number;
  available_rooms: number;
  blocked_rooms: number;
  rooms_sold: number;
  stop_sell: boolean;
  effective_available: number;
}

export interface RatePlanPrice {
  rate_plan_id: number;
  name: string;
  description?: string;
  prepayment_required: boolean;
  price_amount: number;
  nightly_total: number;
  stay_total: number;
}

export interface HotelRoomTypeAvailability {
  room_type_id: number;
  name: string;
  description?: string;
  capacity: {
    max_adults: number;
    max_children: number;
    max_occupancy: number;
  };
  capacity_ok: boolean;
  nights: number;
  continuous_inventory: boolean;
  min_available_rooms: number | null;
  can_fulfill: boolean;
  stop_sell_any: boolean;
  total_rooms_reference: number;
  daily: HotelRoomTypeDaily[];
  avg_price?: number;
  rate_plans: RatePlanPrice[];
}

export interface HotelRoomTypesResponse {
  meta: {
    hotel_id: number;
    checkin: string;
    checkout: string;
    nights: number;
    requested_rooms: number;
    adults: number;
    children: number;
    total_guests: number;
  };
  hotel: {
    id: number;
    name: string;
    star_rating?: number;
    address_line?: string;
    province?: string;
    district?: string;
    ward?: string;
    description: string;
  };
  room_types: HotelRoomTypeAvailability[];
}
