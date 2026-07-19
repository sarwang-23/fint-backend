import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { NotificationsService } from '../notifications/services/notifications.service';
import { ListUsersQueryDto, AdminNotifyDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  getAllUsers(query: ListUsersQueryDto) {
    return this.adminRepository.findAllUsers(query);
  }

  async getUserDetail(id: string) {
    const user = await this.adminRepository.findUserDetail(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deactivateUser(id: string, requestingAdminId: string) {
    if (id === requestingAdminId) {
      // Prevents an admin locking themselves out with no other admin left
      // to reactivate the account.
      throw new BadRequestException('You cannot deactivate your own account');
    }
    const target = await this.adminRepository.findUserRoleAndId(id);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    return this.adminRepository.setActiveStatus(id, false);
  }

  async reactivateUser(id: string) {
    const target = await this.adminRepository.findUserRoleAndId(id);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    return this.adminRepository.setActiveStatus(id, true);
  }

  getPlatformAnalytics() {
    return this.adminRepository.getPlatformStats();
  }

  async notifyUser(dto: AdminNotifyDto) {
    const target = await this.adminRepository.findUserRoleAndId(dto.userId);
    if (!target) {
      throw new NotFoundException('Target user not found');
    }
    return this.notificationsService.notify(dto.userId, dto.title, dto.message, dto.type);
  }
}
