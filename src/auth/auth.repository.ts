import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByRefreshToken(token: string) {
    return this.prisma.user.findFirst({
      where: { refreshToken: token },
    });
  }

  async createUser(data: Prisma.UserCreateInput, gender?: any) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });
      await tx.userProfile.create({
        data: {
          userId: user.id,
          gender: gender ?? null,
        },
      });
      return user;
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
