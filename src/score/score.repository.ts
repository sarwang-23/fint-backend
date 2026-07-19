import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ScoreRepository {
  constructor(private prisma: PrismaService) {}

  async getUserFinancialData(userId: string) {
    const [
      incomes,
      expenses,
      loans,
      assets,
      investments,
      insurances,
      retirement,
      accounts
    ] = await Promise.all([
      this.prisma.income.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.expense.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.loan.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.asset.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.investment.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.insurance.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.retirement.findFirst({ where: { userId, deletedAt: null } }),
      this.prisma.financialAccount.findMany({ where: { userId, deletedAt: null } })
    ]);

    return {
      incomes,
      expenses,
      loans,
      assets,
      investments,
      insurances,
      retirement,
      accounts
    };
  }

  async saveScoreHistory(userId: string, data: any) {
    return this.prisma.scoreHistory.create({
      data: {
        userId,
        score: data.score,
        grade: data.grade,
        risk: data.risk,
        factors: {
          create: data.factors.map((f: any) => ({
            pillar: f.pillar,
            weight: f.weight,
            score: f.score,
            remarks: f.remarks
          }))
        }
      },
      include: { factors: true }
    });
  }

  async getLatestScore(userId: string) {
    return this.prisma.scoreHistory.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      include: { factors: true }
    });
  }

  async getScoreHistory(userId: string) {
    return this.prisma.scoreHistory.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      include: { factors: true }
    });
  }
}
