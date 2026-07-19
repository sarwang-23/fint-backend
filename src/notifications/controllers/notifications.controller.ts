import { Controller, Get, Patch, UseGuards, Req, Logger, Query } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all in-app notifications for the user' })
  async getNotifications(@Req() req: any, @Query('limit') limit: number = 20) {
    this.logger.log(`GET /api/v1/notifications - User: ${req.user.id}`);
    const data = await this.notificationsService.getNotifications(req.user.id, Number(limit));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    this.logger.log(`PATCH /api/v1/notifications/read-all - User: ${req.user.id}`);
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true, message: 'All notifications marked as read', timestamp: new Date().toISOString() };
  }
}
