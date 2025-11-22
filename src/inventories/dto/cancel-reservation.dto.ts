import { IsInt, Min, IsDateString } from 'class-validator';

/**
 * DTO hủy / hoàn phòng đã bán. Giả sử quantity là số phòng đã bán cần trả lại.
 */
export class CancelReservationDto {
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