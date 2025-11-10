import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionStatus } from '../entities/hotel-module-subscription.entity';
import { Type } from 'class-transformer';

export class UpdateHotelModuleSubscriptionDto {
  hotel_id?: never;
  module_code?: never;
  started_at?: never;
  suspended_at?: never;
  cancelled_at?: never;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  @Type(() => String)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsBoolean()
  is_active?: Boolean;

  @IsOptional()
  @IsString()
  expires_at?: string;
}
