import { Controller, Get, UseGuards, Req, Query, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Analytics Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get full financial analytics dashboard data' })
  @ApiQuery({ name: 'range', required: false, enum: ['1M', '3M', '6M', '1Y', 'ALL'], description: 'Time range for trends' })
  async getDashboard(@Req() req: any, @Query('range') range: '1M' | '3M' | '6M' | '1Y' | 'ALL' = '6M') {
    this.logger.log(`GET /api/v1/analytics/dashboard - User: ${req.user.id}, Range: ${range}`);
    const data = await this.analyticsService.getDashboardAnalytics(req.user.id, range);
    return {
      success: true,
      data,
      message: 'Dashboard analytics fetched successfully',
      timestamp: new Date().toISOString()
    };
  }
}
