import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const FREE_DAILY_LIMIT = 20;

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user is allowed to make an AI request.
   * Free users: 20 requests/day. Premium users: unlimited.
   */
  async isAllowed(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    // Check user role (premium check)
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === 'ADMIN') return { allowed: true, remaining: Infinity, limit: Infinity };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.aIAuditLog.count({
      where: { userId, status: 'SUCCESS', createdAt: { gte: startOfDay } },
    });

    const remaining = Math.max(0, FREE_DAILY_LIMIT - todayCount);
    return {
      allowed: todayCount < FREE_DAILY_LIMIT,
      remaining,
      limit: FREE_DAILY_LIMIT,
    };
  }

  /**
   * Get usage stats for a user.
   */
  async getStats(userId: string) {
    const [totalCalls, totalTokens] = await Promise.all([
      this.prisma.aIAuditLog.count({ where: { userId } }),
      this.prisma.aIAuditLog.aggregate({ where: { userId }, _sum: { tokenUsage: true } }),
    ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCalls = await this.prisma.aIAuditLog.count({ where: { userId, createdAt: { gte: startOfDay } } });

    return {
      totalCalls,
      todayCalls,
      remainingToday: Math.max(0, FREE_DAILY_LIMIT - todayCalls),
      totalTokens: totalTokens._sum.tokenUsage ?? 0,
    };
  }
}
