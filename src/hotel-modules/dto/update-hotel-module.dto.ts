import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHotelModuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}
