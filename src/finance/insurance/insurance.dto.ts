import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { InsuranceType } from '@prisma/client';

export class CreateInsuranceDto {
  @IsOptional()
  @IsEnum(InsuranceType)
  insuranceType?: InsuranceType;

  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsNumber()
  @Min(0)
  premiumAmount: number;

  @IsNumber()
  @Min(0)
  coverageAmount: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
  
}
