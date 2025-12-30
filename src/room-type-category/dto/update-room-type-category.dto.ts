import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomTypeCategoryDto } from './create-room-type-category.dto';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateRoomTypeCategoryDto extends PartialType(CreateRoomTypeCategoryDto) {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;
}