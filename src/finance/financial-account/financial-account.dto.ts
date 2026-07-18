import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { AccountType, AccountStatus } from '@prisma/client';

export class CreateFinancialAccountDto {
  @IsString()
  bankName: string;

  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentBalance?: number;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}