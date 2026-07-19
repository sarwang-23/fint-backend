import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ListUsersQueryDto } from './admin.dto';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildUserWhere(query: ListUsersQueryDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return where;
  }

  async findAllUsers(query: ListUsersQueryDto) {
    const where = this.buildUserWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  findUserDetail(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        profile: true,
        scoreHistories: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            reports: true,
            aiRecommendations: true,
            financialGoals: true,
          },
        },
      },
    });
  }

  findUserRoleAndId(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true },
    });
  }

  setActiveStatus(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }

  // ── Platform analytics ──────────────────────────────────────────────
  // Kept as one method with parallel queries rather than several small
  // repository calls, since the service only ever needs them all together.

  async getPlatformStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      newUsersLast30Days,
      usersByRole,
      scoreDistribution,
      avgScore,
      totalReports,
      totalNotifications,
      notificationsByStatus,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      // Note: this counts every calculated ScoreHistory row by grade, not
      // just each user's latest score — a user who has recalculated 5 times
      // contributes 5 rows. Good enough for a platform-trend view; swap for
      // a "latest per user" query if you need per-user grade distribution.
      this.prisma.scoreHistory.groupBy({ by: ['grade'], _count: { grade: true } }),
      this.prisma.scoreHistory.aggregate({ _avg: { score: true } }),
      this.prisma.report.count(),
      this.prisma.notification.count(),
      this.prisma.notification.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      verifiedUsers,
      newUsersLast30Days,
      usersByRole: Object.fromEntries(
        usersByRole.map((r) => [r.role, r._count.role]),
      ) as Record<UserRole, number>,
      scoreDistributionByGrade: Object.fromEntries(
        scoreDistribution.map((s) => [s.grade, s._count.grade]),
      ),
      averageScore: Math.round(avgScore._avg.score ?? 0),
      totalReports,
      totalNotifications,
      notificationsByStatus: Object.fromEntries(
        notificationsByStatus.map((n) => [n.status, n._count.status]),
      ),
    };
  }
}
