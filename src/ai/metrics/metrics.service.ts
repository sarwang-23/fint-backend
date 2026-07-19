import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getErrorMessage } from '../utils/error.util';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a single AI call metric to AIAuditLog.
   * Called by every service after an AI interaction.
   */
  async record(data: {
    userId: string;
    provider: string;
    feature: string;
    responseTime: number;
    tokens: number;
    status: 'SUCCESS' | 'FAILURE';
    cost?: number;
  }) {
    try {
      await this.prisma.aIAuditLog.create({
        data: {
          userId: data.userId,
          action: data.feature,
          provider: data.provider,
          status: data.status,
          responseTime: data.responseTime,
          tokenUsage: data.tokens,
          cost: data.cost ?? null,
        },
      });
    } catch (error) {
      // Metrics should never crash the main flow
      this.logger.error(`Failed to record metric: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Fetch aggregated metrics for a given feature.
   */
  async getFeatureMetrics(feature: string) {
    return this.prisma.aIAuditLog.aggregate({
      where: { action: feature },
      _avg: { responseTime: true, tokenUsage: true },
      _sum: { tokenUsage: true },
      _count: true,
    });
  }
}
