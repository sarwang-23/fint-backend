import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { GoalType, GoalStatus } from '@prisma/client';

export class CreateFinancialGoalDto {
  @IsOptional()
  @IsEnum(GoalType)
  goalType?: GoalType;

  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  targetAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}