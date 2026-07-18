import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRetirementDto {
  @IsOptional()
  @IsInt()
  @Min(18)
  targetRetirementAge?: number;

  @IsInt()
  @Min(1)
  currentAge: number;

  @IsNumber()
  @Min(0)
  currentSavings: number;

  @IsNumber()
  @Min(0)
  targetCorpus: number;

  @IsNumber()
  @Min(0)
  monthlyContribution: number;

  @IsNumber()
  @Min(0)
  expectedReturnRate: number;

  @IsOptional()
  @IsString()
  notes?: string;
}