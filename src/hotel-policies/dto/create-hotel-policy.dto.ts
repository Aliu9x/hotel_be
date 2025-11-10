import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class CreateHotelPolicyDto {
  @IsOptional()
  @IsString()
  hotel_id?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'default_checkin_time phải có định dạng HH:mm hoặc HH:mm:ss',
  })
  default_checkin_time?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'default_checkout_time phải có định dạng HH:mm hoặc HH:mm:ss',
  })
  default_checkout_time?: string;

  @IsOptional()
  @IsString()
  house_rules?: string;

  @IsOptional()
  @IsString()
  children_policy?: string;

  @IsOptional()
  @IsString()
  smoking_policy?: string;

  @IsOptional()
  @IsString()
  pets_policy?: string;

  @IsOptional()
  @IsString()
  other_policies?: string;
}
