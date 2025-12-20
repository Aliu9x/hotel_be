import { IsInt, IsOptional, IsString, IsIn, IsEmail } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  registration_code!: string;

  @IsIn(['PENDING', 'APPROVED'])
  approval_status!: 'PENDING' | 'APPROVED';

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  star_rating?: number;

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
