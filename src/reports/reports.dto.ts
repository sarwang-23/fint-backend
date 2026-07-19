import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ReportType } from '@prisma/client';

export class GenerateReportDto {
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  // If omitted, the period is derived from reportType relative to today
  // (e.g. MONTHLY -> current calendar month). Provide both to generate a
  // report for a custom/past period instead.
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}
