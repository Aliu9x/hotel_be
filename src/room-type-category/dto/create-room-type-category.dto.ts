import { IsString, Length } from "class-validator";

export class CreateRoomTypeCategoryDto {
  @IsString()
  @Length(1, 100)
  name: string;
}