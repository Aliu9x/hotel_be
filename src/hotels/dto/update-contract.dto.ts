import { IsOptional, IsString, IsEmail } from 'class-validator';

// Contract step payload (legal + signatory + filenames)
export class UpdateContractDto {
  // Legal entity
  @IsString()
  legal_name!: string;

  @IsString()
  legal_address!: string;

  // Signatory
  @IsString()
  signer_full_name!: string;

  @IsString()
  signer_phone!: string;

  @IsEmail()
  signer_email!: string;

  // Optional filenames (set via upload endpoint or FE passes back)
  @IsOptional()
  @IsString()
  identity_doc_filename?: string;

  @IsOptional()
  @IsString()
  contract_pdf_filename?: string;
}