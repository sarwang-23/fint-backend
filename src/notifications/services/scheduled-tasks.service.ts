import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';
import { ReportsService } from '../../reports/services/reports.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly reportsService: ReportsService,
  ) {}

  // Run everyday at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyChecks() {
    this.logger.log('Running daily notification checks...');
    const users = await this.prisma.user.findMany({ select: { id: true } });

    for (const user of users) {
      await this.notificationsService.checkLowSavings(user.id);
      await this.notificationsService.checkGoalAchieved(user.id);
      await this.checkEmiReminders(user.id);
    }
  }

  // Run on 1st of every month at 9:00 AM
  @Cron('0 9 1 * *')
  async handleMonthlyReports() {
    this.logger.log('Generating and sending monthly reports...');
    const users = await this.prisma.user.findMany({ select: { id: true } });

    for (const user of users) {
      // Create In-App Notification
      await this.notificationsService.notifyAndEmail(
        user.id,
        'Monthly Financial Report Ready',
        'Your monthly financial report has been generated. You can download it from the reports section.',
        'INFO'
      );
    }
  }

  private async checkEmiReminders(userId: string) {
    const loans = await this.prisma.loan.findMany({ where: { userId, status: 'ACTIVE', deletedAt: null } });
    const today = new Date().getDate();
    
    // Simulate EMI date as 5th of every month
    const emiDate = 5; 
    
    if (emiDate - today === 3) {
      for (const loan of loans) {
        await this.notificationsService.notifyAndEmail(
          userId,
          'EMI Reminder',
          `Your EMI of ₹${loan.emiAmount} for ${loan.lenderName} loan is due in 3 days.`,
          'REMINDER'
        );
      }
    }
  }
}
