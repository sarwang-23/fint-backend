import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PromptBuilderService } from './prompt-builder.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { AIResponse, AIRecommendation } from '../interfaces/ai-response.interface';
import { RecommendationRepository } from '../repositories/recommendation.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { getErrorMessage, getErrorStack } from '../utils/error.util';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly gemini: GeminiProvider,
    private readonly recommendationRepo: RecommendationRepository,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async generateRecommendation(userId: string) {
    const start = Date.now();
    try {
      // 1. Caching Strategy — check within last 24 hours
      const last = await this.recommendationRepo.findLatest(userId);
      if (last && (Date.now() - last.createdAt.getTime()) < 24 * 60 * 60 * 1000) {
        this.logger.log(`Returning cached recommendations for user ${userId}`);
        return {
          success: true,
          summary: last.summary,
          recommendations: last.recommendations,
          nextSteps: last.nextSteps,
          generatedAt: last.createdAt,
          cached: true,
        };
      }

      // 2. Fetch Finance Data
      const financeData = await this.fetchFinancialData(userId);
      if (financeData.income === 0 && financeData.expense === 0) {
        return { success: false, message: 'Complete your financial profile first.' };
      }

      // 3. Build Prompt
      const prompt = this.promptBuilder.buildRecommendationPrompt(financeData);

      // 4. Gemini Call with retries
      const aiResponse = await this.callAI(prompt);

      // 5. Save via Repository + Audit Log in transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.aIRecommendation.create({
          data: {
            userId,
            summary: aiResponse.summary,
            riskLevel: aiResponse.riskLevel,
            recommendations: aiResponse.recommendations as any,
            nextSteps: aiResponse.nextSteps as any,
            score: aiResponse.score,
          },
        });
        await tx.aIAuditLog.create({
          data: {
            userId,
            action: 'RECOMMENDATION',
            provider: 'gemini',
            status: 'SUCCESS',
            responseTime: (Date.now() - start) / 1000,
            tokenUsage: 0, // Will be populated when Gemini provider returns token count
          },
        });
      });

      return {
        success: true,
        summary: aiResponse.summary,
        recommendations: aiResponse.recommendations,
        nextSteps: aiResponse.nextSteps,
        generatedAt: new Date(),
        cached: false,
      };
    } catch (error) {
      // Log audit failure
      await this.auditLog.log({
        userId,
        action: 'RECOMMENDATION',
        provider: 'gemini',
        status: 'FAILURE',
        responseTime: (Date.now() - start) / 1000,
        tokenUsage: 0,
      }).catch(() => {}); // silent fail on audit

      this.logger.error(`Recommendation failed for ${userId}: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof HttpException) throw error;
      throw new HttpException('AI Service Unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private async fetchFinancialData(userId: string) {
    const [incomes, expenses, loans, investments, insurances, scoreHistory] = await Promise.all([
      this.prisma.income.findMany({ where: { userId } }),
      this.prisma.expense.findMany({ where: { userId } }),
      this.prisma.loan.findMany({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.investment.findMany({ where: { userId } }),
      this.prisma.insurance.findMany({ where: { userId } }),
      this.prisma.scoreHistory.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      income: incomes.reduce((acc, inc) => acc + Number(inc.amount), 0),
      expense: expenses.reduce((acc, exp) => acc + Number(exp.amount), 0),
      loan: loans.reduce((acc, l) => acc + Number(l.emiAmount), 0),
      investment: investments.reduce((acc, inv) => acc + Number(inv.currentPrice), 0),
      insurance: insurances.length > 0,
      score: scoreHistory?.score ?? 0,
    };
  }

  private async callAI(prompt: string, retries = 3): Promise<AIResponse> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.gemini.generateJSON<AIResponse>(prompt);
        if (this.validateResponse(response)) return response;
        this.logger.warn(`Invalid AI JSON on attempt ${attempt}`);
      } catch (error) {
        this.logger.warn(`AI call failed (attempt ${attempt}): ${getErrorMessage(error)}`);
        if (attempt === retries) throw new Error('AI response failed after retries');
      }
    }
    throw new Error('AI response failed after retries');
  }

  private validateResponse(response: any): response is AIResponse {
    if (!response || typeof response !== 'object') return false;
    return !!(response.summary && response.riskLevel && Array.isArray(response.recommendations) && Array.isArray(response.nextSteps));
  }

  async getRecommendationHistory(userId: string, page = 1, limit = 10) {
    return this.recommendationRepo.findByUser(userId, page, limit);
  }

  async deleteRecommendation(id: string) {
    return this.recommendationRepo.delete(id);
  }
}
