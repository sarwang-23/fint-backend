import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsRepository } from './notifications.repository';
import { MailService } from './mail.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Records a Notification row AND (for EMAIL type) actually sends the
   * email via MailService. This is what auth.service.ts's forgot-password
   * flow calls now, instead of console.log-ing the reset token.
   */
  async notify(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.EMAIL,
  ) {
    const notification = await this.notificationsRepository.create(userId, type, title, message);

    if (type === NotificationType.EMAIL) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`notify() called with unknown userId ${userId}`);
        return notification;
      }
      const sent = await this.mailService.send(user.email, title, message);
      return sent
        ? this.notificationsRepository.markSent(notification.id)
        : this.notificationsRepository.markFailed(notification.id);
    }

    // PUSH/SMS: no provider wired up yet — record stays PENDING.
    // Swap in a real push/SMS provider here when one is added.
    return notification;
  }

  getAll(userId: string, unreadOnly = false) {
    return this.notificationsRepository.findAllForUser(userId, unreadOnly);
  }

  getUnreadCount(userId: string) {
    return this.notificationsRepository.countUnread(userId);
  }

  async markRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.findOneForUser(id, userId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return this.notificationsRepository.markRead(id);
  }
}
