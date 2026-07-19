import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ReportType } from '@prisma/client';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    userId: string,
    reportType: ReportType,
    periodStart: Date,
    periodEnd: Date,
    summary: Record<string, unknown>,
  ) {
    return this.prisma.report.create({
      data: { userId, reportType, periodStart, periodEnd, summary: summary as any },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.report.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });
  }

  // Ownership-scoped by design, same pattern as notifications — the
  // finance modules' :id routes are missing this check, this one isn't.
  findOneForUser(id: string, userId: string) {
    return this.prisma.report.findFirst({ where: { id, userId } });
  }

  // ── raw data the report is built from ──────────────────────────
  getExpensesInPeriod(userId: string, start: Date, end: Date) {
    return this.prisma.expense.findMany({
      where: { userId, expenseDate: { gte: start, lte: end } },
    });
  }

  // Income has no per-transaction date (it's recurring, described by
  // frequency + optional start/end), so "active during period" means
  // its active window overlaps the report period at all.
  getIncomesActiveInPeriod(userId: string, start: Date, end: Date) {
    return this.prisma.income.findMany({
      where: {
        userId,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: end } }] },
          { OR: [{ endDate: null }, { endDate: { gte: start } }] },
        ],
      },
    });
  }

  getLatestScoreAsOf(userId: string, asOf: Date) {
    return this.prisma.scoreHistory.findFirst({
      where: { userId, calculatedAt: { lte: asOf } },
      orderBy: { calculatedAt: 'desc' },
    });
  }
}
