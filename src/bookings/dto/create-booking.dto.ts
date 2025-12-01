import { IsDateString, IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt() hotelId!: number;
  @IsInt() roomTypeId!: number;
  @IsInt() ratePlanId!: number;

  @IsDateString() checkin!: string;
  @IsDateString() checkout!: string;

  @IsInt() @Min(1) adults!: number;
  @IsInt() @Min(0) children!: number;
  @IsInt() @Min(1) rooms!: number;

  @IsString() contactName!: string;
  @IsEmail() contactEmail!: string;
  @IsString() contactPhone!: string;
  @IsInt() @IsOptional() isSelfBook?: number; // 1 | 0

  @IsString() guestName!: string;

  @IsOptional()
  specialRequests?: string[]; // mảng từ FE

  /* Pricing snapshot */
  @IsInt() @Min(0) pricePerNight!: number; // gửi vào để lưu snapshot hoặc dùng decimal
  @IsOptional() promoTag?: string;
  @IsInt() @Min(0) prepayRequired!: number; // 1/0
}

export class ReserveBookingDto {
  @IsInt() bookingId!: number;
}

export class CancelHoldDto {
  @IsInt() bookingId!: number;
}

export class UpdatePaymentMethodDto {
  @IsInt() bookingId!: number;
  @IsString() paymentMethod!: string; // VIETQR | PAY_AT_HOTEL ...
}

export interface BookingResponse {
  id: number;
  reservationCode?: string;
  status: string;
  expiresAt?: string;
}