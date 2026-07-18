import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

const ALERT_THRESHOLD_ENV = 'AI_BUDGET_ALERT_THRESHOLD'; // e.g. 0.8 = 80%
const DAILY_BUDGET_ENV = 'AI_DAILY_BUDGET_USD';

// Estimated cost per 1000 tokens (Gemini Flash pricing as of 2026)
const COST_PER_1K_TOKENS_USD = 0.00015;

@Injectable()
export class CostTrackingService {
  private readonly logger = new Logger(CostTrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Estimate cost in USD for a given token count.
   */
  estimateCost(tokens: number): number {
    return (tokens / 1000) * COST_PER_1K_TOKENS_USD;
  }

  /**
   * Get today's total AI cost and check against budget.
   */
  async getDailyCost(): Promise<{ totalCostUsd: number; budget: number; percentUsed: number; alert: boolean }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await this.prisma.aIAuditLog.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { tokenUsage: true },
    });

    const totalTokens = result._sum.tokenUsage ?? 0;
    const totalCostUsd = this.estimateCost(totalTokens);
    const budget = parseFloat(this.config.get<string>(DAILY_BUDGET_ENV) ?? '5.0');
    const threshold = parseFloat(this.config.get<string>(ALERT_THRESHOLD_ENV) ?? '0.8');
    const percentUsed = budget > 0 ? (totalCostUsd / budget) * 100 : 0;
    const alert = totalCostUsd >= budget * threshold;

    if (alert) {
      this.logger.warn(`⚠️  AI Budget Alert: $${totalCostUsd.toFixed(4)} used of $${budget} daily budget (${percentUsed.toFixed(1)}%)`);
    }

    return { totalCostUsd, budget, percentUsed, alert };
  }

  /**
   * Cost breakdown by feature.
   */
  async getCostByFeature() {
    const features = ['RECOMMENDATION', 'FORECAST', 'SIMULATION', 'CHAT'];
    const breakdown: Record<string, { tokens: number; costUsd: string }> = {};

    for (const feature of features) {
      const agg = await this.prisma.aIAuditLog.aggregate({
        where: { action: feature },
        _sum: { tokenUsage: true },
      });
      const tokens = agg._sum.tokenUsage ?? 0;
      breakdown[feature] = { tokens, costUsd: `$${this.estimateCost(tokens).toFixed(6)}` };
    }

    return breakdown;
  }
}
