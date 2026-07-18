import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PromptBuilderService } from './prompt-builder.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { ScoreService } from '../../score/services/score.service';
import { SimulationRepository } from '../repositories/simulation.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { getErrorMessage, getErrorStack } from '../utils/error.util';

export interface SimulationAIResponse {
  impact: string;
  summary: string;
  advantages: string[];
  disadvantages: string[];
  recommendation: string;
}

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly gemini: GeminiProvider,
    private readonly scoreService: ScoreService,
    private readonly simulationRepo: SimulationRepository,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async generateSimulation(userId: string, scenarioData: any) {
    const start = Date.now();
    try {
      this.logger.log(`Simulation for user ${userId} — Scenario: ${scenarioData.scenarioType}`);

      const currentData = await this.fetchFinancialData(userId);
      if (currentData.income === 0 && currentData.expense === 0) {
        throw new HttpException('Insufficient financial data to simulate', HttpStatus.BAD_REQUEST);
      }

      // Deep clone, apply scenario — DB never touched
      const clonedData = this.cloneAndApplyScenario(currentData, scenarioData);

      const currentSavings = currentData.income - currentData.expense;
      const newSavings = clonedData.income - clonedData.expense;

      const oldScore = this.scoreService.calculate(currentData);
      const newScore = this.scoreService.calculate(clonedData);

      const changesString = this.buildChangesString(currentData, clonedData, currentSavings, newSavings);
      const prompt = this.promptBuilder.buildSimulationPrompt({ oldScore, newScore, changes: changesString });
      const aiResponse = await this.callAI(prompt);

      // Save + Audit in transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.aISimulation.create({
          data: {
            userId,
            scenarioType: scenarioData.scenarioType,
            oldScore,
            newScore,
            scenario: scenarioData,
            summary: aiResponse.summary,
            impact: aiResponse.impact,
          },
        });
        await tx.aIAuditLog.create({
          data: {
            userId,
            action: 'SIMULATION',
            provider: 'gemini',
            status: 'SUCCESS',
            responseTime: (Date.now() - start) / 1000,
            tokenUsage: 0,
          },
        });
      });

      return {
        currentScore: oldScore,
        predictedScore: newScore,
        impact: aiResponse.impact,
        summary: aiResponse.summary,
        advantages: aiResponse.advantages,
        disadvantages: aiResponse.disadvantages,
        recommendation: aiResponse.recommendation,
      };
    } catch (error) {
      await this.auditLog.log({ userId, action: 'SIMULATION', provider: 'gemini', status: 'FAILURE', responseTime: (Date.now() - start) / 1000, tokenUsage: 0 }).catch(() => {});
      this.logger.error(`Simulation failed for ${userId}: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) throw error;
      throw new HttpException('Simulation Service Unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private async fetchFinancialData(userId: string) {
    const [incomes, expenses, investments, loans] = await Promise.all([
      this.prisma.income.findMany({ where: { userId } }),
      this.prisma.expense.findMany({ where: { userId } }),
      this.prisma.investment.findMany({ where: { userId } }),
      this.prisma.loan.findMany({ where: { userId, status: 'ACTIVE' } }),
    ]);
    return {
      income: incomes.reduce((acc, i) => acc + Number(i.amount), 0),
      expense: expenses.reduce((acc, e) => acc + Number(e.amount), 0),
      investment: investments.reduce((acc, i) => acc + Number(i.currentPrice), 0),
      loan: loans.reduce((acc, l) => acc + Number(l.remainingBalance), 0),
    };
  }

  private cloneAndApplyScenario(current: any, scenario: any) {
    const temp = JSON.parse(JSON.stringify(current));
    if (scenario.investmentIncrease > 0) temp.investment += scenario.investmentIncrease;
    if (scenario.loanPrepayment > 0) temp.loan = Math.max(0, temp.loan - scenario.loanPrepayment);
    if (scenario.salaryIncrease > 0) temp.income += scenario.salaryIncrease;
    if (scenario.expenseReduction > 0) temp.expense = Math.max(0, temp.expense - scenario.expenseReduction);
    return temp;
  }

  private buildChangesString(current: any, clone: any, currentSavings: number, newSavings: number) {
    const changes: string[] = [];
    if (current.income !== clone.income) changes.push(`Monthly Income: ₹${current.income} → ₹${clone.income}`);
    if (current.expense !== clone.expense) changes.push(`Monthly Expense: ₹${current.expense} → ₹${clone.expense}`);
    if (current.investment !== clone.investment) changes.push(`Investment Corpus: ₹${current.investment} → ₹${clone.investment}`);
    if (current.loan !== clone.loan) changes.push(`Total Loan Debt: ₹${current.loan} → ₹${clone.loan}`);
    if (currentSavings !== newSavings) changes.push(`Monthly Savings: ₹${currentSavings} → ₹${newSavings}`);
    return changes.join('\n');
  }

  private async callAI(prompt: string, retries = 3): Promise<SimulationAIResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.gemini.generateJSON<SimulationAIResponse>(prompt);
        if (this.validateSimulation(response)) return response;
      } catch (error) {
        this.logger.warn(`AI Simulation attempt ${attempt} failed: ${getErrorMessage(error)}`);
        if (attempt === retries) {
          return { impact: 'Neutral', summary: 'Score calculated, AI analysis unavailable.', advantages: ['Score projected mathematically.'], disadvantages: ['AI analysis unavailable.'], recommendation: 'Review score changes manually.' };
        }
      }
    }
    throw new Error('AI response failed');
  }

  private validateSimulation(r: any): r is SimulationAIResponse {
    return !!(r?.impact && r?.summary && Array.isArray(r?.advantages) && Array.isArray(r?.disadvantages) && r?.recommendation);
  }

  async getSimulationHistory(userId: string, page = 1, limit = 10) {
    return this.simulationRepo.history(userId, page, limit);
  }
}
