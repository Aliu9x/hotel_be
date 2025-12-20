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
  @IsInt() @IsOptional() isSelfBook?: number; 

  @IsString() guestName!: string;

  @IsOptional()
  specialRequests?: string[]; 


  @IsInt() @Min(0) pricePerNight!: number; 
  @IsOptional() promoTag?: string;
  @IsInt() @Min(0) prepayRequired!: number; 
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