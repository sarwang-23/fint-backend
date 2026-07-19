import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { getErrorMessage, getErrorStack } from '../utils/error.util';
import { BUDGET_PROMPT } from '../prompts/budget.prompt';
import { EXPENSE_ANALYSIS_PROMPT } from '../prompts/expense-analysis.prompt';
import { INVESTMENT_PROMPT, SAVINGS_PROMPT } from '../prompts/investment-savings.prompt';
import { LOAN_ADVICE_PROMPT, GOAL_PLANNING_PROMPT, RISK_ANALYSIS_PROMPT } from '../prompts/advisory.prompt';

@Injectable()
export class AdvisoryService {
  private readonly logger = new Logger(AdvisoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiProvider,
    private readonly auditLog: AuditLogRepository,
  ) {}

  // ─────────────────────────────────────────────
  // 1. BUDGET SUGGESTIONS
  // ─────────────────────────────────────────────
  async getBudgetSuggestions(userId: string) {
    const start = Date.now();
    try {
      const data = await this.fetchFinancialData(userId);
      const categoryBreakdown = this.buildExpenseCategoryBreakdown(data.expenses);

      let prompt = BUDGET_PROMPT
        .replace('{{income}}', data.totalIncome.toString())
        .replace('{{expense}}', data.totalExpense.toString())
        .replace('{{categoryBreakdown}}', categoryBreakdown)
        .replace('{{loan}}', data.totalEmi.toString())
        .replace('{{score}}', data.score.toString());

      const result = await this.gemini.generateJSON(prompt);
      await this.logAudit(userId, 'BUDGET_SUGGESTION', start, 'SUCCESS');
      return result;
    } catch (error) {
      await this.logAudit(userId, 'BUDGET_SUGGESTION', start, 'FAILURE');
      this.logger.error(`Budget suggestion failed for ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to generate budget suggestions', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ─────────────────────────────────────────────
  // 2. EXPENSE ANALYSIS
  // ─────────────────────────────────────────────
  async analyzeSpending(userId: string) {
    const start = Date.now();
    try {
      const data = await this.fetchFinancialData(userId);
      const categoryBreakdown = this.buildExpenseCategoryBreakdown(data.expenses);
      const topExpenses = data.expenses
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 5)
        .map(e => `- ${e.title}: ₹${e.amount} (${e.category})`)
        .join('\n');

      let prompt = EXPENSE_ANALYSIS_PROMPT
        .replace('{{income}}', data.totalIncome.toString())
        .replace('{{expense}}', data.totalExpense.toString())
        .replace('{{expenseBreakdown}}', categoryBreakdown)
        .replace('{{topExpenses}}', topExpenses || 'No expenses recorded');

      const result = await this.gemini.generateJSON(prompt);
      await this.logAudit(userId, 'EXPENSE_ANALYSIS', start, 'SUCCESS');
      return result;
    } catch (error) {
      await this.logAudit(userId, 'EXPENSE_ANALYSIS', start, 'FAILURE');
      this.logger.error(`Expense analysis failed for ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to analyze expenses', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ─────────────────────────────────────────────
  // 3. SAVINGS RECOMMENDATIONS
  // ─────────────────────────────────────────────
  async getSavingsRecommendations(userId: string) {
    const start = Date.now();
    try {
      const data = await this.fetchFinancialData(userId);
      const surplus = data.totalIncome - data.totalExpense;
      const currentSavings = data.accounts.reduce((s, a) => s + Number(a.currentBalance), 0);
      const emergencyTarget = data.totalExpense * 6;
      const savingsRate = data.totalIncome > 0 ? ((surplus / data.totalIncome) * 100).toFixed(1) : '0';
      const goals = data.goals.map(g => `${g.title}: ₹${g.targetAmount} by ${g.deadline || 'No deadline'}`).join('\n') || 'None';

      let prompt = SAVINGS_PROMPT
        .replace('{{income}}', data.totalIncome.toString())
        .replace('{{expense}}', data.totalExpense.toString())
        .replace('{{currentSavings}}', currentSavings.toString())
        .replace('{{emergencyTarget}}', emergencyTarget.toString())
        .replace('{{savingsRate}}', savingsRate.toString())
        .replace('{{goals}}', goals)
        .replace('{{score}}', data.score.toString());

      const result = await this.gemini.generateJSON(prompt);
      await this.logAudit(userId, 'SAVINGS_RECOMMENDATION', start, 'SUCCESS');
      return result;
    } catch (error) {
      await this.logAudit(userId, 'SAVINGS_RECOMMENDATION', start, 'FAILURE');
      this.logger.error(`Savings recommendation failed for ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to generate savings recommendations', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ─────────────────────────────────────────────
  // 4. INVESTMENT SUGGESTIONS
  // ─────────────────────────────────────────────
  async getInvestmentSuggestions(userId: string) {
    const start = Date.now();
    try {
      const data = await this.fetchFinancialData(userId);
      const surplus = data.totalIncome - data.totalExpense;
      const portfolioBreakdown = data.investments.map(i =>
        `- ${i.name} (${i.investmentType}): ₹${Number(i.currentPrice) * Number(i.quantity || 1)}`
      ).join('\n') || 'No investments yet';
      const totalPortfolio = data.investments.reduce((s, i) =>
        s + Number(i.currentPrice) * Number(i.quantity || 1), 0);

      const riskProfile = data.score > 70 ? 'AGGRESSIVE' : data.score > 50 ? 'MODERATE' : 'CONSERVATIVE';
      const age = data.profile?.dateOfBirth
        ? Math.floor((Date.now() - new Date(data.profile.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 30;

      let prompt = INVESTMENT_PROMPT
        .replace('{{income}}', data.totalIncome.toString())
        .replace('{{savings}}', surplus.toString())
        .replace('{{portfolioBreakdown}}', portfolioBreakdown)
        .replace('{{totalPortfolio}}', totalPortfolio.toString())
        .replace('{{score}}', data.score.toString())
        .replace('{{riskProfile}}', riskProfile)
        .replace('{{age}}', age.toString());

      const result = await this.gemini.generateJSON(prompt);
      await this.logAudit(userId, 'INVESTMENT_SUGGESTION', start, 'SUCCESS');
      return result;
    } catch (error) {
      await this.logAudit(userId, 'INVESTMENT_SUGGESTION', start, 'FAILURE');
      this.logger.error(`Investment suggestion failed for ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to generate investment suggestions', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ─────────────────────────────────────────────
  // 5. LOAN ADVICE
  // ─────────────────────────────────────────────
  async getLoanAdvice(userId: string) {
    const start = Date.now();
    try {
      const data = await this.fetchFinancialData(userId);
      const activeLoans = data.loans.filter(l => l.status === 'ACTIVE');
      if (activeLoans.length === 0) {
        return { message: 'No active loans found. Great job staying debt-free!' };
      }

      const loanBreakdown = activeLoans.map(l =>
        `- ${l.loanType} (${l.lenderName}): EMI ₹${l.emiAmount}, Balance ₹${l.remainingBalance}, Rate ${l.interestRate}%`
      ).join('\n');

      const surplus = data.totalIncome - data.totalExpense;
      const dtiRatio = data.totalIncome > 0
        ? ((data.totalEmi / data.totalIncome) * 100).toFixed(1)
        : '0';

      let prompt = LOAN_ADVICE_PROMPT
        .replace('{{income}}', data.totalIncome.toString())
        .replace('{{loanBreakdown}}', loanBreakdown)
        .replace('{{totalEmi}}', data.totalEmi.toString())
        .replace('{{dtiRatio}}', dtiRatio)
        .replace('{{surplus}}', surplus.toString())
        .replace('{{score}}', data.score.toString());

      const result = await this.gemini.generateJSON(prompt);
      await this.logAudit(userId, 'LOAN_ADVICE', start, 'SUCCESS');
      return result;
    } catch (error) {
      await this.logAudit(userId, 'LOAN_ADVICE', start, 'FAILURE');
      this.logger.error(`Loan advice failed for ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to generate loan advice', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ─────────────────────────────────────────────
  // 6. GOAL PLANNING
  // ─────────────────────────────────────────────
  async planGoals(userId: string) {
    const start = Date.now();
    try {
      const data = await this.fetchFinancialData(userId);
      const activeGoals = data.goals.filter(g => g.status === 'ACTIVE');
      if (activeGoals.length === 0) {
        return { message: 'No active goals found. Start by setting a financial goal in the app!' };
      }

      const surplus = data.totalIncome - data.totalExpense;
      const currentSavings = data.accounts.reduce((s, a) => s + Number(a.currentBalance), 0);
      const goalsBreakdown = activeGoals.map(g =>
        `- ${g.title} (${g.goalType}): Target ₹${g.targetAmount}, Saved ₹${g.currentAmount}, Deadline: ${g.deadline || 'None'}`
      ).join('\n');

      let prompt = GOAL_PLANNING_PROMPT
        .replace('{{income}}', data.totalIncome.toString())
        .replace('{{surplus}}', surplus.toString())
        .replace('{{goalsBreakdown}}', goalsBreakdown)
        .replace('{{currentSavings}}', currentSavings.toString())
        .replace('{{score}}', data.score.toString());

      const result = await this.gemini.generateJSON(prompt);
      await this.logAudit(userId, 'GOAL_PLANNING', start, 'SUCCESS');
      return result;
    } catch (error) {
      await this.logAudit(userId, 'GOAL_PLANNING', start, 'FAILURE');
      this.logger.error(`Goal planning failed for ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to plan goals', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ─────────────────────────────────────────────
  // 7. RISK ANALYSIS
  // ─────────────────────────────────────────────
  async analyzeRisk(userId: string) {
    const start = Date.now();
    try {
      const data = await this.fetchFinancialData(userId);
      const totalAssets = data.assets.reduce((s, a) => s + Number(a.currentValue), 0)
        + data.accounts.reduce((s, a) => s + Number(a.currentBalance), 0)
        + data.investments.reduce((s, i) => s + Number(i.currentPrice) * Number(i.quantity || 1), 0);
      const totalLiabilities = data.loans.reduce((s, l) => s + Number(l.remainingBalance), 0);
      const emergencyFund = data.accounts.reduce((s, a) => s + Number(a.currentBalance), 0);

      const insuranceBreakdown = data.insurances.map(i =>
        `- ${i.insuranceType}: ₹${i.coverageAmount} (${i.provider})`
      ).join('\n') || 'No insurance coverage';

      const investmentBreakdown = data.investments.map(i =>
        `- ${i.investmentType}: ₹${Number(i.currentPrice) * Number(i.quantity || 1)}`
      ).join('\n') || 'No investments';

      let prompt = RISK_ANALYSIS_PROMPT
        .replace('{{income}}', data.totalIncome.toString())
        .replace('{{expense}}', data.totalExpense.toString())
        .replace('{{totalAssets}}', totalAssets.toString())
        .replace('{{totalLiabilities}}', totalLiabilities.toString())
        .replace('{{insuranceBreakdown}}', insuranceBreakdown)
        .replace('{{investmentBreakdown}}', investmentBreakdown)
        .replace('{{emergencyFund}}', emergencyFund.toString())
        .replace('{{score}}', data.score.toString());

      const result = await this.gemini.generateJSON(prompt);
      await this.logAudit(userId, 'RISK_ANALYSIS', start, 'SUCCESS');
      return result;
    } catch (error) {
      await this.logAudit(userId, 'RISK_ANALYSIS', start, 'FAILURE');
      this.logger.error(`Risk analysis failed for ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to analyze risk profile', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────
  private async fetchFinancialData(userId: string) {
    const [incomes, expenses, loans, assets, investments, insurances, accounts, goals, scoreHistory, profile] =
      await Promise.all([
        this.prisma.income.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.expense.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.asset.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.investment.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.insurance.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.financialAccount.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.financialGoal.findMany({ where: { userId, deletedAt: null } }),
        this.prisma.scoreHistory.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        this.prisma.userProfile.findFirst({ where: { userId } }),
      ]);

    const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalEmi = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.emiAmount), 0);

    return {
      incomes, expenses, loans, assets, investments, insurances, accounts, goals, profile,
      totalIncome, totalExpense, totalEmi,
      score: scoreHistory?.score ?? 0,
    };
  }

  private buildExpenseCategoryBreakdown(expenses: any[]): string {
    const catMap: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || 'OTHER';
      catMap[cat] = (catMap[cat] || 0) + Number(e.amount);
    });
    if (Object.keys(catMap).length === 0) return 'No expenses recorded';
    return Object.entries(catMap)
      .map(([cat, amt]) => `- ${cat}: ₹${amt}`)
      .join('\n');
  }

  private async logAudit(userId: string, action: string, start: number, status: 'SUCCESS' | 'FAILURE') {
    await this.auditLog.log({
      userId,
      action,
      provider: 'gemini',
      status,
      responseTime: (Date.now() - start) / 1000,
      tokenUsage: 0,
    }).catch(() => {});
  }
}
