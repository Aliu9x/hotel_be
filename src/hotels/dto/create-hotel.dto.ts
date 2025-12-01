import { IsInt, IsOptional, IsString, IsIn, IsEmail } from 'class-validator';

export class CreateHotelDto {
  // Registration meta
  @IsString()
  registration_code!: string; // numeric-only from FE

  @IsIn(['PENDING', 'APPROVED'])
  approval_status!: 'PENDING' | 'APPROVED';

  // Basic info
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  star_rating?: number;

  // Address (no country_code, no timezone)
  @IsOptional()
  @IsString()
  address_line?: string;

  @IsOptional()
  @IsInt()
  province_id?: number;

  @IsOptional()
  @IsInt()
  district_id?: number;

  @IsOptional()
  @IsInt()
  ward_id?: number;

  // Contact (overview)
  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;
}