import { IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO dùng cho điều chỉnh từng phần (delta hoặc override)
 * Nếu truyền delta* thì áp dụng cộng/trừ; nếu truyền override* thì set cứng.
 * Không nên trộn delta và override cho cùng một trường trong 1 request.
 */
export class AdjustInventoryDto {
  @IsOptional()
  @IsInt()
  deltaTotalRooms?: number;

  @IsOptional()
  @IsInt()
  deltaAvailableRooms?: number;

  @IsOptional()
  @IsInt()
  deltaBlockedRooms?: number;

  @IsOptional()
  @IsInt()
  deltaRoomsSold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  overrideTotalRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  overrideAvailableRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  overrideBlockedRooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  overrideRoomsSold?: number;

  @IsOptional()
  @IsBoolean()
  stopSell?: boolean;
}