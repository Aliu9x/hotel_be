import { IsOptional, IsString, IsEmail, IsIn } from 'class-validator';
import { HotelApprovalStatus } from '../entities/hotel.entity';

export class UpdateContractDto {
  @IsString()
  id_hotel!: string;

  @IsString()
  legal_name!: string;

  @IsString()
  legal_address!: string;

  @IsString()
  signer_full_name!: string;

  @IsString()
  signer_phone!: string;

  @IsEmail()
  signer_email!: string;

  @IsOptional()
  @IsString()
  identity_doc_filename?: string;

  @IsOptional()
  @IsString()
  contract_pdf_filename?: string;
}
export class UpdateApprovalDto {
  @IsIn(['PENDING', 'APPROVED', 'SUSPENDED'])
  status: HotelApprovalStatus;
}
