import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimulationDto {
  @ApiProperty({ description: 'Type of scenario', enum: ['INVESTMENT', 'LOAN', 'INCOME', 'EXPENSE', 'RETIREMENT', 'GOAL', 'MIXED'] })
  @IsEnum(['INVESTMENT', 'LOAN', 'INCOME', 'EXPENSE', 'RETIREMENT', 'GOAL', 'MIXED'])
  scenarioType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  investmentIncrease?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  loanPrepayment?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryIncrease?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expenseReduction?: number;
}
