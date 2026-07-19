import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../common/mail/mail.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // Generate In-App Notification
  async notify(userId: string, title: string, message: string, type: string = 'INFO') {
    const notification = await this.prisma.notification.create({
      data: { userId, title, message, type },
    });
    // In future: Emit websocket event here
    return notification;
  }

  // Generate In-App + Email Notification
  async notifyAndEmail(userId: string, title: string, message: string, type: string = 'INFO') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Create In-App Notification
    await this.notify(userId, title, message, type);

    // Send Email
    await this.mailService.sendMail(
      user.email,
      title,
      `<p>${message}</p>`
    );
  }

  // Get User's In-App Notifications
  async getNotifications(userId: string, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // Setup Event-Driven Triggers (Simulated Checkers for Schedule)
  async checkLowSavings(userId: string) {
    const accounts = await this.prisma.financialAccount.findMany({ where: { userId, deletedAt: null } });
    const totalSavings = accounts.reduce((acc, a) => acc + Number(a.currentBalance), 0);
    
    if (totalSavings < 10000) { // arbitrary threshold
      await this.notifyAndEmail(userId, 'Low Savings Alert', 'Your total savings balance has dropped below ₹10,000. Consider reviewing your budget.', 'WARNING');
    }
  }

  async checkGoalAchieved(userId: string) {
    const goals = await this.prisma.financialGoal.findMany({ where: { userId, status: 'ACTIVE', deletedAt: null } });
    for (const goal of goals) {
      if (Number(goal.currentAmount) >= Number(goal.targetAmount)) {
        await this.notifyAndEmail(userId, 'Goal Achieved! 🎉', `Congratulations! You have successfully reached your goal: ${goal.title}`, 'SUCCESS');
        await this.prisma.financialGoal.update({ where: { id: goal.id }, data: { status: 'COMPLETED' } });
      }
    }
  }
}
