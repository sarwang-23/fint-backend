import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { InsuranceType } from '@prisma/client';

export class CreateInsuranceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(InsuranceType)
  insuranceType?: InsuranceType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  policyNumber?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  premiumAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  coverageAmount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

}

export class UpdateInsuranceDto extends PartialType(CreateInsuranceDto) {}

export class InsuranceFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
