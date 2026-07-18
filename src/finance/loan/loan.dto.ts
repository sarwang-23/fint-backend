import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { LoanType, LoanStatus } from '@prisma/client';

export class CreateLoanDto {
  @IsEnum(LoanType)
  loanType: LoanType;

  @IsString()
  lenderName: string;

  @IsNumber()
  @Min(0)
  principalAmount: number;

  @IsNumber()
  @Min(0)
  interestRate: number;

  @IsNumber()
  @Min(0)
  emiAmount: number;

  @IsNumber()
  @Min(0)
  remainingBalance: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  nextEmiDate?: string;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}