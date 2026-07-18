import { ScoreGrade, RiskLevel } from '@prisma/client';

export interface PillarResult {
  pillar: string;
  weight: number;   // pillar weight in % (out of 100)
  score: number;    // 0-100 raw pillar score, before weighting
  remarks: string;
}

export interface ScoreBreakdown {
  totalScore: number;  // 0-1000
  grade: ScoreGrade;
  risk: RiskLevel;
  pillars: PillarResult[];
}

// Plain-number shape the CalculationService consumes. The service layer is
// responsible for converting Prisma's Decimal fields into numbers before
// calling calculate() — keeps CalculationService pure and unit-testable
// without needing a database or Prisma types.
export interface ScoreInputData {
  incomes: { amount: number; frequency: string }[];
  expenses: { amount: number; expenseDate: Date }[];
  assets: { assetType: string; currentValue: number }[];
  loans: { emiAmount: number; status: string }[];
  investments: { investmentType: string; quantity: number | null; currentPrice: number }[];
  insurances: { insuranceType: string; coverageAmount: number }[];
  retirement: {
    targetRetirementAge: number;
    currentAge: number;
    currentSavings: number;
    targetCorpus: number;
    monthlyContribution: number;
    expectedReturnRate: number;
  } | null;
  goals: { status: string }[];
}
