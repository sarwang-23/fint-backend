import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RecommendationJob {
  private readonly logger = new Logger(RecommendationJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every night at midnight.
   * Marks stale recommendations (> 24 hours old) so the next API call
   * triggers a fresh generation instead of returning outdated cache.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async invalidateStaleRecommendations() {
    this.logger.log('[CRON] Running nightly recommendation cache invalidation...');
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.prisma.aIRecommendation.updateMany({
      where: { createdAt: { lt: cutoff }, deletedAt: null },
      data: { deletedAt: new Date() }, // soft-expire — force fresh generation on next call
    });

    this.logger.log(`[CRON] Expired ${result.count} stale recommendations`);
  }
}
