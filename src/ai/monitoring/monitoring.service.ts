import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [totalCalls, successCalls, failureCalls, avgResponse] = await Promise.all([
      this.prisma.aIAuditLog.count(),
      this.prisma.aIAuditLog.count({ where: { status: 'SUCCESS' } }),
      this.prisma.aIAuditLog.count({ where: { status: 'FAILURE' } }),
      this.prisma.aIAuditLog.aggregate({ _avg: { responseTime: true } }),
    ]);

    const successRate = totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(1) : '0';

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dailyUsers = await this.prisma.aIAuditLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startOfDay } },
    });

    // Feature breakdown
    const features = ['RECOMMENDATION', 'FORECAST', 'SIMULATION', 'CHAT'];
    const featureBreakdown: Record<string, number> = {};
    for (const feature of features) {
      featureBreakdown[feature] = await this.prisma.aIAuditLog.count({ where: { action: feature } });
    }

    return {
      totalCalls,
      successCalls,
      failureCalls,
      successRate: `${successRate}%`,
      avgResponseTime: `${(avgResponse._avg.responseTime ?? 0).toFixed(2)}s`,
      dailyActiveUsers: dailyUsers.length,
      featureBreakdown,
    };
  }

  async getHealthStatus() {
    const status: Record<string, string> = {};

    // DB Check
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      status['database'] = 'Healthy';
    } catch {
      status['database'] = 'Unhealthy';
    }

    // Gemini — treated as healthy unless a real ping is added
    status['gemini'] = 'Healthy';
    status['scheduler'] = 'Healthy';
    status['cache'] = 'Healthy';

    const isHealthy = Object.values(status).every((s) => s === 'Healthy');
    return { status: isHealthy ? 'healthy' : 'degraded', ...status };
  }
}
