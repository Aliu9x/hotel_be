import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Role } from 'src/interfaces/customize.interface';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[A-Za-z0-9_\-\.]+$/, {
    message: 'username chỉ cho phép chữ, số, ., -, _',
  })
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'role không hợp lệ' })
  role: Role;

  @IsOptional()
  hotelId?: string;
}
export class RegisterUserDTo {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[A-Za-z0-9_\-\.]+$/, {
    message: 'username chỉ cho phép chữ, số, ., -, _',
  })
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone: string;

  @IsOptional()
  @IsEnum(Role, { message: 'role không hợp lệ' })
  role?: Role;
}

export class UserLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'admin@example.com', description: 'username' })
  readonly username: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '123456',
    description: 'password',
  })
  readonly password: string;
}
