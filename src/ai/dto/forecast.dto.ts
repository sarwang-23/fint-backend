import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForecastDto {
  @ApiProperty({ description: 'Number of years to forecast', example: 10 })
  @IsNumber()
  @Min(1)
  years: number;

  @ApiProperty({ description: 'Expected annual return percentage', example: 12, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedReturn?: number;
}
