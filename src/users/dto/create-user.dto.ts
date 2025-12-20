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
  MinLength,
} from 'class-validator';
import { Role } from 'src/interfaces/customize.interface';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  full_name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.CUSTOMER;

}
export class RegisterUserDTo {

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName: string;

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
