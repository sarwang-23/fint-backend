import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PromptBuilderService } from './prompt-builder.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { FutureValueCalculator } from '../calculators/future-value.calculator';
import { RetirementCalculator } from '../calculators/retirement.calculator';
import { DebtCalculator } from '../calculators/debt.calculator';
import { EmergencyFundCalculator } from '../calculators/emergency-fund.calculator';
import { ForecastRepository } from '../repositories/forecast.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { getErrorMessage, getErrorStack } from '../utils/error.util';

export interface ForecastAIResponse {
  summary: string;
  futureValue: string;
  risk: string;
  suggestions: string[];
}

@Injectable()
export class ForecastService {
  private readonly logger = new Logger(ForecastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly gemini: GeminiProvider,
    private readonly fvCalculator: FutureValueCalculator,
    private readonly retirementCalculator: RetirementCalculator,
    private readonly debtCalculator: DebtCalculator,
    private readonly emergencyFundCalculator: EmergencyFundCalculator,
    private readonly forecastRepo: ForecastRepository,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async generateForecast(userId: string, years: number = 5) {
    const start = Date.now();
    try {
      this.logger.log(`Generating forecast for user ${userId} over ${years} years`);

      const data = await this.fetchFinancialData(userId);
      if (data.income === 0) throw new HttpException('Income Required to generate a forecast', HttpStatus.BAD_REQUEST);
      if (data.investment < 0) throw new HttpException('Investment cannot be negative', HttpStatus.BAD_REQUEST);

      // Calculations
      const futureValue = this.fvCalculator.calculate(data.investment, data.monthlySip, data.expectedReturn, years);
      const retirementCorpus = this.retirementCalculator.calculate(data.currentAge, data.retirementAge, data.currentSavings, data.monthlySip, data.expectedReturn);
      const debtRatio = this.debtCalculator.calculateDebtRatio(data.monthlyEmi, data.income);
      const savingRate = data.income > 0 ? Math.round(((data.income - data.expense) / data.income) * 100) : 0;

      const forecastData = { futureValue, retirementCorpus, emergencyFund: this.emergencyFundCalculator.calculate(data.expense), debtRatio, savingRate };

      const prompt = this.promptBuilder.buildForecastPrompt(forecastData);
      const aiResponse = await this.callAI(prompt);

      // Save + Audit in transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.aIForecast.create({
          data: {
            userId,
            futureValue,
            retirementCorpus,
            savingRate,
            debtRatio,
            summary: aiResponse.summary,
            risk: aiResponse.risk,
          },
        });
        await tx.aIAuditLog.create({
          data: {
            userId,
            action: 'FORECAST',
            provider: 'gemini',
            status: 'SUCCESS',
            responseTime: (Date.now() - start) / 1000,
            tokenUsage: 0,
          },
        });
      });

      return {
        futureValue,
        retirementCorpus,
        debtRatio,
        savingRate,
        summary: aiResponse.summary,
        risk: aiResponse.risk,
        suggestions: aiResponse.suggestions,
      };
    } catch (error) {
      await this.auditLog.log({ userId, action: 'FORECAST', provider: 'gemini', status: 'FAILURE', responseTime: (Date.now() - start) / 1000, tokenUsage: 0 }).catch(() => {});
      this.logger.error(`Forecast generation failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) throw error;
      throw new HttpException('AI Service Unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private async fetchFinancialData(userId: string) {
    const [incomes, expenses, investments, loans, retirement] = await Promise.all([
      this.prisma.income.findMany({ where: { userId } }),
      this.prisma.expense.findMany({ where: { userId } }),
      this.prisma.investment.findMany({ where: { userId } }),
      this.prisma.loan.findMany({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.retirement.findUnique({ where: { userId } }),
    ]);
    return {
      income: incomes.reduce((acc, i) => acc + Number(i.amount), 0),
      expense: expenses.reduce((acc, e) => acc + Number(e.amount), 0),
      investment: investments.reduce((acc, i) => acc + Number(i.currentPrice), 0),
      monthlyEmi: loans.reduce((acc, l) => acc + Number(l.emiAmount), 0),
      monthlySip: retirement ? Number(retirement.monthlyContribution) : 0,
      expectedReturn: retirement ? Number(retirement.expectedReturnRate) : 10,
      currentAge: retirement ? retirement.currentAge : 30,
      retirementAge: retirement ? retirement.targetRetirementAge : 60,
      currentSavings: retirement ? Number(retirement.currentSavings) : 0,
    };
  }

  private async callAI(prompt: string, retries = 3): Promise<ForecastAIResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.gemini.generateJSON<ForecastAIResponse>(prompt);
        if (this.validateForecast(response)) return response;
        this.logger.warn(`Invalid AI Forecast JSON on attempt ${attempt}`);
      } catch (error) {
        this.logger.warn(`AI call failed (attempt ${attempt}): ${getErrorMessage(error)}`);
        if (attempt === retries) {
          return { summary: 'Calculations successful, AI summary unavailable.', futureValue: 'Check metric', risk: 'Unknown', suggestions: ['Review investments manually'] };
        }
      }
    }
    throw new Error('AI response failed');
  }

  private validateForecast(r: any): r is ForecastAIResponse {
    return !!(r?.summary && r?.futureValue && r?.risk && Array.isArray(r?.suggestions));
  }

  async getForecastHistory(userId: string, page = 1, limit = 10) {
    return this.forecastRepo.history(userId, page, limit);
  }
}
