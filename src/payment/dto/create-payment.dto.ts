import { IsString, IsOptional, IsIn, IsNumberString } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsNumberString()
  amount: string; 

  @IsString()
  orderInfo: string;

  @IsNumberString()
  bookingId: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  ipnUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['captureWallet', 'payWithATM'], {
    message: 'requestType must be captureWallet or payWithATM',
  })
  requestType?: string;

  @IsOptional()
  @IsString()
  extraData?: string;
}


export class CreatePaymentResponseDto {
  payUrl: string;
  orderId: string;
  requestId: string;
  bookingId: string;
}

export class QueryPaymentDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  requestId?: string;
}
