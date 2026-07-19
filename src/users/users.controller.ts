import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateAccountDto, UpdateProfileDto } from './users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Logged-in user's own account + profile — no :id param, always "me",
  // so there's no ownership check to get wrong here (unlike the finance
  // modules' :id routes).
  @Get('me')
  getMe(@Req() req) {
    return this.usersService.getMe(req.user.id);
  }

  @Patch('me')
  updateAccount(@Req() req, @Body() dto: UpdateAccountDto) {
    return this.usersService.updateAccount(req.user.id, dto);
  }

  @Patch('me/profile')
  updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
