import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

// Không cho phép cập nhật code qua DTO này
export class UpdateAmenityDto {
  code?: never;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}