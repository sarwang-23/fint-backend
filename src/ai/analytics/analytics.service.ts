import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Feature usage breakdown (Recommendation, Forecast, Simulation, Chat)
   */
  async getFeatureAnalytics() {
    const features = ['RECOMMENDATION', 'FORECAST', 'SIMULATION', 'CHAT'];
    const total = await this.prisma.aIAuditLog.count();

    const breakdown: Record<string, { count: number; percentage: string }> = {};
    for (const feature of features) {
      const count = await this.prisma.aIAuditLog.count({ where: { action: feature } });
      breakdown[feature] = {
        count,
        percentage: total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%',
      };
    }
    return { total, breakdown };
  }

  /**
   * User-level analytics — calls, tokens, avg cost
   */
  async getUserAnalytics(userId: string) {
    const [callCount, tokenAgg] = await Promise.all([
      this.prisma.aIAuditLog.count({ where: { userId } }),
      this.prisma.aIAuditLog.aggregate({
        where: { userId },
        _sum: { tokenUsage: true },
        _avg: { responseTime: true },
      }),
    ]);

    return {
      userId,
      totalCalls: callCount,
      totalTokens: tokenAgg._sum.tokenUsage ?? 0,
      avgResponseTime: `${(tokenAgg._avg.responseTime ?? 0).toFixed(2)}s`,
    };
  }

  /**
   * Top users by AI usage
   */
  async getTopUsers(limit = 10) {
    return this.prisma.aIAuditLog.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: limit,
    });
  }
}
