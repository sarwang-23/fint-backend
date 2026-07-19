import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationStatus, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, type: NotificationType, title: string, message: string) {
    return this.prisma.notification.create({
      data: { userId, type, title, message },
    });
  }

  markSent(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.SENT, sentAt: new Date() },
    });
  }

  markFailed(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.FAILED },
    });
  }

  findAllForUser(userId: string, unreadOnly: boolean) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Ownership-scoped by design (userId is always part of the where clause)
  // — this is the pattern the finance modules' :id routes are missing.
  findOneForUser(id: string, userId: string) {
    return this.prisma.notification.findFirst({ where: { id, userId } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
