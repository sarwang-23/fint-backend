import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@Req() req, @Query('unread') unread?: string) {
    return this.notificationsService.getAll(req.user.id, unread === 'true');
  }

  @Get('unread-count')
  getUnreadCount(@Req() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  // Ownership checked inside the service (findOneForUser scopes by userId),
  // so a user can only ever mark their own notifications as read.
  @Patch(':id/read')
  markRead(@Req() req, @Param('id') id: string) {
    return this.notificationsService.markRead(id, req.user.id);
  }
}
