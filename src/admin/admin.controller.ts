import { Controller, Get, Patch, Post, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { ListUsersQueryDto, AdminNotifyDto } from './admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Order matters: JwtAuthGuard runs first and populates request.user,
// RolesGuard then reads request.user.role. Every route here additionally
// requires ADMIN — there's no per-route override in this module by design.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/deactivate')
  deactivateUser(@Param('id') id: string, @Req() req) {
    return this.adminService.deactivateUser(id, req.user.id);
  }

  @Patch('users/:id/reactivate')
  reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(id);
  }

  @Get('analytics')
  getAnalytics() {
    return this.adminService.getPlatformAnalytics();
  }

  @Post('notifications')
  notifyUser(@Body() dto: AdminNotifyDto) {
    return this.adminService.notifyUser(dto);
  }
}
