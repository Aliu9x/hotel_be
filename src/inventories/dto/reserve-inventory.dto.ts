import { IsInt, Min, IsDateString } from 'class-validator';

/**
 * DTO để giữ phòng / tạo booking: kiểm tra tất cả ngày trong khoảng [fromDate, toDate)
 */
export class ReserveInventoryDto {
  @IsInt()
  @Min(1)
  hotelId: number;

  @IsInt()
  @Min(1)
  roomTypeId: number;

  @IsDateString()
  fromDate: string; 

  @IsDateString()
  toDate: string; 

  @IsInt()
  @Min(1)
  quantity: number;

}