import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { InvestmentType } from '@prisma/client';

export class CreateInvestmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(InvestmentType)
  investmentType?: InvestmentType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsNumber()
  @Min(0)
  buyPrice: number;

  @IsNumber()
  @Min(0)
  currentPrice: number;

  @IsOptional()
  @IsString()
  broker?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}