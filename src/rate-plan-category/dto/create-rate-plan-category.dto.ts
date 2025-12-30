import { IsString, Length } from 'class-validator';

export class CreateRatePlanCategoryDto {
  @IsString()
  @Length(1, 100)
  name: string;
}
