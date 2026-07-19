import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateAccountDto, UpdateProfileDto } from './users.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdWithProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  updateAccount(id: string, data: UpdateAccountDto) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // upsert instead of plain update: every user gets a blank UserProfile row
  // at signup (see auth.service.ts), but upsert keeps this safe even if
  // that ever changes or a profile row is missing for any reason.
  upsertProfile(userId: string, data: Record<string, unknown>) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}
