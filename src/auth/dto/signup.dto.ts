import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SignupGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class SignupDto {
  @ApiProperty({ example: 'Sarwang' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'abc@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
  })
  password: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: SignupGender, example: SignupGender.MALE })
  @IsOptional()
  @IsEnum(SignupGender)
  gender?: SignupGender;
}
