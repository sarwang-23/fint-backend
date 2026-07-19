import { Injectable } from '@nestjs/common';
import { ScoreGrade, RiskLevel } from '@prisma/client';

@Injectable()
export class ScoreEngine {
  
  calculateScore(financialData: any) {
    const { incomes, expenses, loans, assets, investments, insurances, retirement, accounts } = financialData;

    let totalScore = 0;
    const factors = [];

    // Helper sums
    const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalEmi = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + Number(l.emiAmount), 0);
    const totalSavings = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0);
    
    // 1. Income Stability (10%)
    let incomeScore = 0;
    if (totalIncome > 0) {
      const stableSources = incomes.filter(i => i.category === 'SALARY' || i.category === 'BUSINESS' || i.category === 'PENSION').length;
      incomeScore = stableSources > 0 ? 100 : 50;
    }
    factors.push({ pillar: 'Income Stability', weight: 10, score: incomeScore, remarks: incomeScore === 100 ? 'Stable income detected' : 'Low stability in income sources' });
    totalScore += (incomeScore * 0.10);

    // 2. Cash Flow (15%)
    let cashFlowScore = 0;
    if (totalIncome > 0) {
      const remaining = totalIncome - totalExpense;
      const ratio = remaining / totalIncome;
      if (ratio > 0.4) cashFlowScore = 100;
      else if (ratio > 0.2) cashFlowScore = 75;
      else if (ratio > 0) cashFlowScore = 50;
      else cashFlowScore = 10;
    }
    factors.push({ pillar: 'Cash Flow', weight: 15, score: cashFlowScore, remarks: 'Cash flow ' + (cashFlowScore > 50 ? 'is healthy' : 'needs attention') });
    totalScore += (cashFlowScore * 0.15);

    // 3. Debt Health (15%) (Debt-to-Income Ratio)
    let debtScore = 100;
    if (totalIncome > 0 && totalEmi > 0) {
      const dti = totalEmi / totalIncome;
      if (dti > 0.5) debtScore = 20;
      else if (dti > 0.3) debtScore = 60;
      else debtScore = 90;
    } else if (totalEmi > 0 && totalIncome === 0) {
      debtScore = 0;
    }
    factors.push({ pillar: 'Debt Health', weight: 15, score: debtScore, remarks: debtScore > 60 ? 'Manageable debt levels' : 'High debt burden' });
    totalScore += (debtScore * 0.15);

    // 4. Credit Health (15%) - Simulated since we lack direct credit score integration
    const creditScore = loans.filter(l => l.status === 'DEFAULTED').length > 0 ? 10 : (totalEmi > 0 ? 85 : 100);
    factors.push({ pillar: 'Credit Health', weight: 15, score: creditScore, remarks: creditScore === 10 ? 'Defaults detected' : 'Good credit standing' });
    totalScore += (creditScore * 0.15);

    // 5. Savings Rate (10%)
    let savingsRateScore = 0;
    if (totalIncome > 0) {
      const savingsRate = (totalIncome - totalExpense) / totalIncome;
      if (savingsRate >= 0.2) savingsRateScore = 100;
      else if (savingsRate >= 0.1) savingsRateScore = 70;
      else if (savingsRate > 0) savingsRateScore = 40;
    }
    factors.push({ pillar: 'Savings Rate', weight: 10, score: savingsRateScore, remarks: savingsRateScore >= 70 ? 'Excellent savings rate' : 'Try to save at least 20%' });
    totalScore += (savingsRateScore * 0.10);

    // 6. Emergency Fund (10%) (Target: 6 months of expenses)
    let emergencyScore = 0;
    if (totalExpense > 0) {
      const monthsCovered = totalSavings / totalExpense;
      if (monthsCovered >= 6) emergencyScore = 100;
      else if (monthsCovered >= 3) emergencyScore = 70;
      else if (monthsCovered >= 1) emergencyScore = 40;
      else emergencyScore = 10;
    } else {
      emergencyScore = totalSavings > 0 ? 100 : 0;
    }
    factors.push({ pillar: 'Emergency Fund', weight: 10, score: emergencyScore, remarks: emergencyScore >= 70 ? 'Adequate emergency fund' : 'Build emergency fund to cover 6 months' });
    totalScore += (emergencyScore * 0.10);

    // 7. Insurance Coverage (10%)
    const hasHealth = insurances.some(i => i.insuranceType === 'HEALTH');
    const hasLife = insurances.some(i => i.insuranceType === 'LIFE');
    let insuranceScore = (hasHealth ? 50 : 0) + (hasLife ? 50 : 0);
    factors.push({ pillar: 'Insurance Coverage', weight: 10, score: insuranceScore, remarks: insuranceScore === 100 ? 'Well insured' : 'Consider adding Health/Life insurance' });
    totalScore += (insuranceScore * 0.10);

    // 8. Investment Portfolio (5%)
    let investmentScore = investments.length > 2 ? 100 : (investments.length > 0 ? 60 : 0);
    factors.push({ pillar: 'Investment Portfolio', weight: 5, score: investmentScore, remarks: investmentScore > 0 ? 'Active investor' : 'Start investing to grow wealth' });
    totalScore += (investmentScore * 0.05);

    // 9. Retirement Planning (5%)
    let retirementScore = retirement ? (Number(retirement.monthlyContribution) > 0 ? 100 : 50) : 0;
    factors.push({ pillar: 'Retirement Planning', weight: 5, score: retirementScore, remarks: retirementScore > 0 ? 'Planning for retirement' : 'No retirement plan detected' });
    totalScore += (retirementScore * 0.05);

    // 10. Financial Behaviour (5%) - General activity marker
    const hasGoals = financialData.goals && financialData.goals.length > 0;
    const activeTracking = (incomes.length + expenses.length) > 5;
    let behaviorScore = (hasGoals ? 50 : 0) + (activeTracking ? 50 : 0);
    factors.push({ pillar: 'Financial Behaviour', weight: 5, score: behaviorScore, remarks: behaviorScore > 0 ? 'Good financial discipline' : 'Track more expenses and set goals' });
    totalScore += (behaviorScore * 0.05);

    totalScore = Math.round(totalScore);

    // Determine Grade and Risk
    let grade: ScoreGrade;
    let risk: RiskLevel;

    if (totalScore >= 85) { grade = ScoreGrade.A_PLUS; risk = RiskLevel.VERY_LOW; }
    else if (totalScore >= 75) { grade = ScoreGrade.A; risk = RiskLevel.LOW; }
    else if (totalScore >= 60) { grade = ScoreGrade.B; risk = RiskLevel.MEDIUM; }
    else if (totalScore >= 45) { grade = ScoreGrade.C; risk = RiskLevel.HIGH; }
    else if (totalScore >= 30) { grade = ScoreGrade.D; risk = RiskLevel.CRITICAL; }
    else { grade = ScoreGrade.E; risk = RiskLevel.CRITICAL; }

    return {
      score: totalScore,
      grade,
      risk,
      factors
    };
  }

}
