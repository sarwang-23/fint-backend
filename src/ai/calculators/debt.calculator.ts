import { Injectable } from '@nestjs/common';

@Injectable()
export class DebtCalculator {
  calculateDebtRatio(monthlyEMI: number, monthlyIncome: number): number {
    if (monthlyIncome <= 0) return 0;
    return Math.round((monthlyEMI / monthlyIncome) * 100);
  }
}
