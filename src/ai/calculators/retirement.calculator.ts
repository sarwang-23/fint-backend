import { Injectable } from '@nestjs/common';
import { FutureValueCalculator } from './future-value.calculator';

@Injectable()
export class RetirementCalculator {
  constructor(private readonly fvCalculator: FutureValueCalculator) {}

  calculate(currentAge: number, retirementAge: number, currentSavings: number, monthlySip: number, annualReturnRate: number): number {
    const years = retirementAge - currentAge;
    if (years <= 0) return currentSavings;
    return this.fvCalculator.calculate(currentSavings, monthlySip, annualReturnRate, years);
  }
}
