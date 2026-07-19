import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

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
    try {
      await this.transporter.sendMail({
        from: '"FINT Advisor" <no-reply@fint.com>',
        to: user.email,
        subject: title,
        text: message,
        html: `<p>${message}</p>`,
      });
      this.logger.log(`Email sent to ${user.email} for ${title}`);
    } catch (error: any) {
      // In dev environment with missing SMTP, it's expected to fail. We just log.
      this.logger.warn(`Failed to send email to ${user.email}: ${error.message}`);
    }
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
