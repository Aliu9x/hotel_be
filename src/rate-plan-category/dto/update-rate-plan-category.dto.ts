import { PartialType } from '@nestjs/swagger';
import { CreateRatePlanCategoryDto } from './create-rate-plan-category.dto';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateRatePlanCategoryDto extends PartialType(
  CreateRatePlanCategoryDto,
) {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;
}
