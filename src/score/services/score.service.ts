import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoreService {
  // Basic mock implementation of FINT Score Engine to be used by Simulation
  calculate(financialData: any): number {
    if (!financialData || financialData.income <= 0) return 300;
    
    let score = 500;
    
    // Income vs Expense
    const savingsRatio = (financialData.income - financialData.expense) / financialData.income;
    if (savingsRatio > 0.2) score += 100;
    else if (savingsRatio < 0) score -= 100;

    // Investment
    if (financialData.investment > 0) {
      score += 50;
      if (financialData.investment > financialData.income) score += 50;
    }

    // Debt
    if (financialData.loan > 0) {
      const debtRatio = financialData.loan / (financialData.income * 12);
      if (debtRatio > 0.4) score -= 100;
      else score -= 50;
    } else {
      score += 50;
    }

    return Math.min(Math.max(Math.round(score), 300), 900); // 300 to 900 range
  }
}
