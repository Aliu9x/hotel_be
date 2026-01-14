import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentType } from '../entities/booking.entity';

export class HoldBookingDto {
  @IsInt() hotelId!: number;
  @IsInt() roomTypeId!: number;
  @IsInt() ratePlanId!: number;

  @IsDateString() checkin!: string;
  @IsDateString() checkout!: string;

  @IsInt() @Min(1) adults!: number;
  @IsInt() @Min(0) children!: number;
  @IsInt() @Min(1) rooms!: number;

}
export class CreateBookingDto {
  @IsString() contactName!: string;
  @IsEmail() contactEmail!: string;
  @IsString() contactPhone!: string;
  @IsInt() @IsOptional() isSelfBook?: number;

  @IsString() guestName!: string;

  @IsOptional()
  specialRequests?: string[];

  @IsInt() @Min(0) total_price!: number;
  @IsOptional() promoTag?: string;

}

export class ReserveBookingDto {
  @IsInt() bookingId!: number;
}

export class CancelHoldDto {
  @IsInt() bookingId!: number;
}

export class UpdatePaymentMethodDto {
  @IsInt() bookingId!: number;
  @IsString() paymentMethod!: string;
}

export interface BookingResponse {
  id: number;
  reservationCode?: string;
  status: string;
  expiresAt?: string;
}

export class UpdatePaymentTypeDto {
  @IsString()
  bookingId: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;
}

export class GetHotelDailyRevenueDto {
  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD
}
