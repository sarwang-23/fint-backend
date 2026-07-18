import { Injectable, OnModuleInit } from '@nestjs/common';
import { ScoreGrade, RiskLevel } from '@prisma/client';
import {
  PILLAR_WEIGHTS,
  SCORE_GRADE_THRESHOLDS,
  RISK_THRESHOLDS,
  EMERGENCY_FUND_TARGET_MONTHS,
} from '../../constants/score.constants';
import { PillarResult, ScoreBreakdown, ScoreInputData } from '../interfaces/score.interface';

/**
 * Pure calculation engine for the FINT Score.
 *
 * No DB / Prisma access here on purpose — it only works with plain numbers
 * handed to it by ScoreService. This makes it trivially unit-testable and
 * keeps the weighting formula auditable in one file.
 *
 * IMPORTANT ASSUMPTION (documented, not hidden): the platform has no credit
 * bureau integration yet (that's on the Phase 4 roadmap — "Future Versions").
 * Credit Health is therefore approximated from loan repayment behaviour we
 * *do* have (defaults/status), not an actual bureau score. This should be
 * swapped out once a real bureau integration lands.
 */
@Injectable()
export class CalculationService implements OnModuleInit {
  onModuleInit() {
    const totalWeight = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0);
    if (totalWeight !== 100) {
      throw new Error(
        `PILLAR_WEIGHTS must sum to 100, got ${totalWeight}. Check score.constants.ts`,
      );
    }
  }

  calculate(data: ScoreInputData): ScoreBreakdown {
    const monthlyIncome = this.monthlyIncome(data.incomes);
    const monthlyExpense = this.monthlyExpense(data.expenses);
    const annualIncome = monthlyIncome * 12;
    const liquidAssets = this.liquidAssets(data.assets);

    const pillars: PillarResult[] = [
      this.incomeStability(data.incomes),
      this.cashFlow(monthlyIncome, monthlyExpense),
      this.debtHealth(data.loans, monthlyIncome),
      this.creditHealth(data.loans),
      this.savings(liquidAssets, annualIncome),
      this.emergencyFund(liquidAssets, monthlyExpense),
      this.insurance(data.insurances, annualIncome),
      this.investments(data.investments, annualIncome),
      this.retirementReadiness(data.retirement),
      this.financialBehaviour(data),
    ];

    const totalScore = Math.round(
      pillars.reduce((sum, p) => sum + p.score * (p.weight / 100), 0) * 10,
    );

    return {
      totalScore,
      grade: this.gradeFor(totalScore),
      risk: this.riskFor(totalScore),
      pillars,
    };
  }

  // ── helpers ─────────────────────────────────────────────

  private clamp(value: number, min = 0, max = 100): number {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  private gradeFor(score: number): ScoreGrade {
    return SCORE_GRADE_THRESHOLDS.find((t) => score >= t.min)!.grade as ScoreGrade;
  }

  private riskFor(score: number): RiskLevel {
    return RISK_THRESHOLDS.find((t) => score >= t.min)!.risk as RiskLevel;
  }

  private monthlyIncome(incomes: ScoreInputData['incomes']): number {
    const FREQ_TO_MONTHLY: Record<string, number> = {
      DAILY: 30,
      WEEKLY: 4.33,
      MONTHLY: 1,
      QUARTERLY: 1 / 3,
      YEARLY: 1 / 12,
      ONE_TIME: 0, // not treated as recurring income
    };
    return incomes.reduce(
      (sum, i) => sum + i.amount * (FREQ_TO_MONTHLY[i.frequency] ?? 0),
      0,
    );
  }

  private monthlyExpense(expenses: ScoreInputData['expenses']): number {
    if (expenses.length === 0) return 0;
    const dates = expenses.map((e) => e.expenseDate.getTime());
    const monthsSpan = Math.max(
      1,
      this.monthDiff(new Date(Math.min(...dates)), new Date(Math.max(...dates))) + 1,
    );
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return total / monthsSpan;
  }

  private monthDiff(from: Date, to: Date): number {
    return (
      (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
    );
  }

  private liquidAssets(assets: ScoreInputData['assets']): number {
    const LIQUID_TYPES = ['CASH', 'SAVINGS', 'FIXED_DEPOSIT'];
    return assets
      .filter((a) => LIQUID_TYPES.includes(a.assetType))
      .reduce((sum, a) => sum + a.currentValue, 0);
  }

  // ── pillars ─────────────────────────────────────────────

  private incomeStability(incomes: ScoreInputData['incomes']): PillarResult {
    if (incomes.length === 0) {
      return {
        pillar: 'Income Stability',
        weight: PILLAR_WEIGHTS.INCOME_STABILITY,
        score: 0,
        remarks: 'No income sources recorded yet.',
      };
    }
    const sourceScore = this.clamp((Math.min(incomes.length, 5) / 5) * 50);
    const recurring = incomes.filter((i) => i.frequency !== 'ONE_TIME').length;
    const recurringScore = this.clamp((recurring / incomes.length) * 50);
    const score = Math.round(sourceScore + recurringScore);
    return {
      pillar: 'Income Stability',
      weight: PILLAR_WEIGHTS.INCOME_STABILITY,
      score,
      remarks: `${incomes.length} income source(s), ${recurring} recurring.`,
    };
  }

  private cashFlow(monthlyIncome: number, monthlyExpense: number): PillarResult {
    if (monthlyIncome <= 0) {
      return {
        pillar: 'Cash Flow',
        weight: PILLAR_WEIGHTS.CASH_FLOW,
        score: 0,
        remarks: 'No recurring income recorded — cannot assess cash flow.',
      };
    }
    const savingsRate = (monthlyIncome - monthlyExpense) / monthlyIncome;
    const score = Math.round(this.clamp((savingsRate / 0.3) * 100));
    return {
      pillar: 'Cash Flow',
      weight: PILLAR_WEIGHTS.CASH_FLOW,
      score,
      remarks: `Savings rate ~${Math.round(savingsRate * 100)}% of monthly income.`,
    };
  }

  private debtHealth(loans: ScoreInputData['loans'], monthlyIncome: number): PillarResult {
    if (loans.length === 0) {
      return {
        pillar: 'Debt Health',
        weight: PILLAR_WEIGHTS.DEBT_HEALTH,
        score: 100,
        remarks: 'No active loans.',
      };
    }
    const totalEmi = loans
      .filter((l) => l.status !== 'CLOSED')
      .reduce((sum, l) => sum + l.emiAmount, 0);
    const dti = monthlyIncome > 0 ? totalEmi / monthlyIncome : 1;
    let score = this.clamp((1 - dti / 0.5) * 100);
    const defaults = loans.filter((l) => l.status === 'DEFAULTED').length;
    score = this.clamp(score - defaults * 20);
    return {
      pillar: 'Debt Health',
      weight: PILLAR_WEIGHTS.DEBT_HEALTH,
      score: Math.round(score),
      remarks: `Debt-to-income ~${Math.round(dti * 100)}%${defaults ? `, ${defaults} defaulted loan(s).` : '.'}`,
    };
  }

  private creditHealth(loans: ScoreInputData['loans']): PillarResult {
    // Proxy pillar — see class-level doc comment. No bureau data source yet.
    if (loans.length === 0) {
      return {
        pillar: 'Credit Health',
        weight: PILLAR_WEIGHTS.CREDIT_HEALTH,
        score: 70,
        remarks: 'No loan history — neutral score (thin file), pending bureau integration.',
      };
    }
    const defaults = loans.filter((l) => l.status === 'DEFAULTED').length;
    const defaultRatio = defaults / loans.length;
    const score = Math.round(this.clamp(100 - defaultRatio * 100));
    return {
      pillar: 'Credit Health',
      weight: PILLAR_WEIGHTS.CREDIT_HEALTH,
      score,
      remarks: 'Approximated from loan repayment status (bureau integration pending).',
    };
  }

  private savings(liquidAssets: number, annualIncome: number): PillarResult {
    if (annualIncome <= 0) {
      return {
        pillar: 'Savings',
        weight: PILLAR_WEIGHTS.SAVINGS,
        score: liquidAssets > 0 ? 50 : 0,
        remarks: 'No recurring income on record to benchmark savings against.',
      };
    }
    const ratio = liquidAssets / annualIncome;
    const score = Math.round(this.clamp((ratio / 0.5) * 100));
    return {
      pillar: 'Savings',
      weight: PILLAR_WEIGHTS.SAVINGS,
      score,
      remarks: `Liquid savings ~${Math.round(ratio * 100)}% of annual income.`,
    };
  }

  private emergencyFund(liquidAssets: number, monthlyExpense: number): PillarResult {
    if (monthlyExpense <= 0) {
      return {
        pillar: 'Emergency Fund',
        weight: PILLAR_WEIGHTS.EMERGENCY_FUND,
        score: liquidAssets > 0 ? 50 : 0,
        remarks: 'No expense history recorded to benchmark the fund against.',
      };
    }
    const monthsCovered = liquidAssets / monthlyExpense;
    const score = Math.round(
      this.clamp((monthsCovered / EMERGENCY_FUND_TARGET_MONTHS) * 100),
    );
    return {
      pillar: 'Emergency Fund',
      weight: PILLAR_WEIGHTS.EMERGENCY_FUND,
      score,
      remarks: `Covers ~${monthsCovered.toFixed(1)} month(s) of expenses (target: ${EMERGENCY_FUND_TARGET_MONTHS}).`,
    };
  }

  private insurance(insurances: ScoreInputData['insurances'], annualIncome: number): PillarResult {
    const hasHealth = insurances.some((i) => i.insuranceType === 'HEALTH');
    const life = insurances.filter((i) => i.insuranceType === 'LIFE');
    const lifeCoverage = life.reduce((sum, i) => sum + i.coverageAmount, 0);
    const recommendedLifeCover = annualIncome * 10; // common rule-of-thumb benchmark

    let score = 0;
    if (hasHealth) score += 40;
    if (life.length > 0) score += 30;
    if (recommendedLifeCover > 0) {
      score += this.clamp((lifeCoverage / recommendedLifeCover) * 30, 0, 30);
    }
    return {
      pillar: 'Insurance Protection',
      weight: PILLAR_WEIGHTS.INSURANCE,
      score: Math.round(this.clamp(score)),
      remarks: `${hasHealth ? 'Health cover present' : 'No health cover'}; ${life.length ? 'life cover present' : 'no life cover'}.`,
    };
  }

  private investments(investments: ScoreInputData['investments'], annualIncome: number): PillarResult {
    if (investments.length === 0) {
      return {
        pillar: 'Investments',
        weight: PILLAR_WEIGHTS.INVESTMENTS,
        score: 0,
        remarks: 'No investments recorded.',
      };
    }
    const distinctTypes = new Set(investments.map((i) => i.investmentType)).size;
    const totalValue = investments.reduce(
      (sum, i) => sum + i.currentPrice * (i.quantity ?? 1),
      0,
    );
    const diversityScore = this.clamp((distinctTypes / 4) * 50, 0, 50);
    const valueScore = annualIncome > 0
      ? this.clamp((totalValue / annualIncome) * 50, 0, 50)
      : this.clamp(totalValue > 0 ? 25 : 0, 0, 50);
    return {
      pillar: 'Investments',
      weight: PILLAR_WEIGHTS.INVESTMENTS,
      score: Math.round(diversityScore + valueScore),
      remarks: `${distinctTypes} investment type(s), value ~${Math.round(totalValue)}.`,
    };
  }

  private retirementReadiness(retirement: ScoreInputData['retirement']): PillarResult {
    if (!retirement) {
      return {
        pillar: 'Retirement Readiness',
        weight: PILLAR_WEIGHTS.RETIREMENT_READINESS,
        score: 20,
        remarks: 'No retirement plan set up yet.',
      };
    }
    const years = Math.max(retirement.targetRetirementAge - retirement.currentAge, 1);
    const r = retirement.expectedReturnRate / 100;
    // Simple compounding approximation (annual compounding, ignores intra-year timing).
    const projectedFromCurrent = retirement.currentSavings * Math.pow(1 + r, years);
    const projectedFromContributions = retirement.monthlyContribution * 12 * years;
    const projectedCorpus = projectedFromCurrent + projectedFromContributions;
    const adequacy = retirement.targetCorpus > 0
      ? projectedCorpus / retirement.targetCorpus
      : 0;
    const score = Math.round(this.clamp(adequacy * 100));
    return {
      pillar: 'Retirement Readiness',
      weight: PILLAR_WEIGHTS.RETIREMENT_READINESS,
      score,
      remarks: `Projected corpus at ${retirement.targetRetirementAge} is ~${Math.round(adequacy * 100)}% of target.`,
    };
  }

  private financialBehaviour(data: ScoreInputData): PillarResult {
    // Heuristic proxy: how many of the platform's data categories the user
    // actively maintains, plus whether they're tracking goals. There's no
    // direct "did the user log in and review their budget" signal yet, so
    // data completeness across modules is used as a stand-in engagement
    // measure. Revisit once real usage-analytics events are being captured.
    const categories = [
      data.incomes.length > 0,
      data.expenses.length > 0,
      data.assets.length > 0,
      data.investments.length > 0,
      data.insurances.length > 0,
      data.retirement !== null,
      data.goals.length > 0,
    ];
    const completeness = categories.filter(Boolean).length / categories.length;
    const activeGoals = data.goals.filter((g) => g.status === 'ACTIVE').length;
    const goalBonus = activeGoals > 0 ? 10 : 0;
    const score = Math.round(this.clamp(completeness * 90 + goalBonus));
    return {
      pillar: 'Financial Behaviour',
      weight: PILLAR_WEIGHTS.FINANCIAL_BEHAVIOUR,
      score,
      remarks: `${Math.round(completeness * 100)}% of financial profile maintained.`,
    };
  }
}
