import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ForecastJob {
  private readonly logger = new Logger(ForecastJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every Sunday at 1 AM.
   * Soft-expires forecasts older than 7 days so fresh projections
   * are generated when users next request a forecast.
   */
  @Cron('0 1 * * 0') // Every Sunday 01:00
  async invalidateWeeklyForecasts() {
    this.logger.log('[CRON] Running weekly forecast cache invalidation...');
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.aIForecast.updateMany({
      where: { createdAt: { lt: cutoff }, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`[CRON] Expired ${result.count} stale forecasts`);
  }

  /**
   * Runs on the last day of every month at 23:00.
   * Placeholder for monthly financial report generation.
   */
  @Cron('0 23 28-31 * *') // Near month-end
  async monthlyReportTrigger() {
    this.logger.log('[CRON] Month-end report trigger fired');
    // TODO: Integrate with ReportService when ready
  }
}
