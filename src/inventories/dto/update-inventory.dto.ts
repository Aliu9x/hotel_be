import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  totalRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  availableRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  blockedRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  roomsSold?: number;

  @IsOptional()
  @IsBoolean()
  stopSell?: boolean;
}