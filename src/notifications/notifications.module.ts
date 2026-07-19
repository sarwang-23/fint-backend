import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { ScheduledTasksService } from './services/scheduled-tasks.service';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, ScheduledTasksService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
