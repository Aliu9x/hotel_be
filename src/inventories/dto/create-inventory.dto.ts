import { IsDateString, IsBoolean, IsInt, Min, IsPositive } from 'class-validator';

export class CreateInventoryDto {
  @IsInt()
  @Min(1)
  hotelId: number;

  @IsInt()
  @Min(1)
  roomTypeId: number;

  @IsDateString()
  inventoryDate: string;

  @IsInt()
  @Min(0)
  totalRooms: number;

  @IsInt()
  @Min(0)
  availableRooms: number;

  @IsInt()
  @Min(0)
  blockedRooms: number;

  @IsInt()
  @Min(0)
  roomsSold: number;

  @IsBoolean()
  stopSell: boolean;
}