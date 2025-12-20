import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";
import { Role } from "src/interfaces/customize.interface";

export class ListUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(1000)
  limit: number = 10;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(["created_at", "updatedAt", "full_name"])
  orderBy?: "created_at" | "updatedAt" | "full_name";

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  order?: "ASC" | "DESC";
}
