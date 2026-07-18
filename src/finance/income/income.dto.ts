import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { IncomeCategory, IncomeFrequency } from '@prisma/client';

export class CreateIncomeDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsString()
  source: string;

  @IsEnum(IncomeCategory)
  category: IncomeCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(IncomeFrequency)
  frequency: IncomeFrequency;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
