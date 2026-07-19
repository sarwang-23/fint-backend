import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportType } from '@prisma/client';
import { ReportsRepository } from './reports.repository';
import { GenerateReportDto } from './reports.dto';

const FREQ_TO_MONTHLY: Record<string, number> = {
  DAILY: 30,
  WEEKLY: 4.33,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  YEARLY: 1 / 12,
  ONE_TIME: 0,
};

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async generate(userId: string, dto: GenerateReportDto) {
    const reportType = dto.reportType ?? ReportType.MONTHLY;
    const { periodStart, periodEnd } = this.resolvePeriod(reportType, dto.periodStart, dto.periodEnd);

    const [expenses, incomes, latestScore] = await Promise.all([
      this.reportsRepository.getExpensesInPeriod(userId, periodStart, periodEnd),
      this.reportsRepository.getIncomesActiveInPeriod(userId, periodStart, periodEnd),
      this.reportsRepository.getLatestScoreAsOf(userId, periodEnd),
    ]);

    const monthsInPeriod = Math.max(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      1 / 30, // floor so a same-day custom range doesn't divide-by-near-zero
    );

    const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expenseByCategory = this.groupSum(
      expenses,
      (e: (typeof expenses)[number]) => e.category,
      (e: (typeof expenses)[number]) => Number(e.amount),
    );

    // Recurring incomes are normalised to a monthly rate, then scaled to
    // however many months the report period spans — same approach as
    // calculation.service.ts's monthlyIncome() helper, applied over a
    // period instead of just "this month".
    const incomeTotal = incomes.reduce((sum, i) => {
      const monthly = Number(i.amount) * (FREQ_TO_MONTHLY[i.frequency] ?? 0);
      return sum + monthly * monthsInPeriod;
    }, 0);
    const incomeByCategory = this.groupSum(
      incomes,
      (i: (typeof incomes)[number]) => i.category,
      (i: (typeof incomes)[number]) => Number(i.amount) * (FREQ_TO_MONTHLY[i.frequency] ?? 0) * monthsInPeriod,
    );

    const netSavings = incomeTotal - expenseTotal;
    const savingsRate = incomeTotal > 0 ? netSavings / incomeTotal : 0;

    const summary = {
      period: { start: periodStart.toISOString(), end: periodEnd.toISOString(), type: reportType },
      income: { total: Math.round(incomeTotal), byCategory: incomeByCategory },
      expense: { total: Math.round(expenseTotal), byCategory: expenseByCategory },
      netSavings: Math.round(netSavings),
      savingsRate: Math.round(savingsRate * 100) / 100,
      score: latestScore
        ? {
            value: latestScore.score,
            grade: latestScore.grade,
            risk: latestScore.risk,
            calculatedAt: latestScore.calculatedAt,
          }
        : null,
    };

    return this.reportsRepository.create(userId, reportType, periodStart, periodEnd, summary);
  }

  getAll(userId: string) {
    return this.reportsRepository.findAllForUser(userId);
  }

  async getOne(id: string, userId: string) {
    const report = await this.reportsRepository.findOneForUser(id, userId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async renderAsText(id: string, userId: string): Promise<string> {
    const report = await this.getOne(id, userId);
    const s = report.summary as any;
    const lines = [
      `FINT Financial Report — ${report.reportType}`,
      `Period: ${new Date(s.period.start).toDateString()} to ${new Date(s.period.end).toDateString()}`,
      '',
      `Total Income:  ₹${s.income.total}`,
      `Total Expense: ₹${s.expense.total}`,
      `Net Savings:   ₹${s.netSavings} (${Math.round(s.savingsRate * 100)}% of income)`,
      '',
      'Expense by category:',
      ...Object.entries(s.expense.byCategory).map(([k, v]) => `  - ${k}: ₹${v}`),
      '',
      'Income by category:',
      ...Object.entries(s.income.byCategory).map(([k, v]) => `  - ${k}: ₹${v}`),
      '',
      s.score
        ? `FINT Score at report time: ${s.score.value}/1000 (Grade ${s.score.grade}, Risk ${s.score.risk})`
        : 'FINT Score: not calculated yet for this period.',
      '',
      `Generated: ${new Date(report.generatedAt).toString()}`,
    ];
    return lines.join('\n');
  }

  private resolvePeriod(reportType: ReportType, startStr?: string, endStr?: string) {
    if (startStr && endStr) {
      return { periodStart: new Date(startStr), periodEnd: new Date(endStr) };
    }
    const now = new Date();
    const end = now;
    let start: Date;
    switch (reportType) {
      case ReportType.YEARLY:
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case ReportType.QUARTERLY:
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case ReportType.MONTHLY:
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { periodStart: start, periodEnd: end };
  }

  private groupSum<T>(items: T[], keyFn: (item: T) => string, valueFn: (item: T) => number) {
    const result: Record<string, number> = {};
    for (const item of items) {
      const key = keyFn(item);
      result[key] = Math.round((result[key] ?? 0) + valueFn(item));
    }
    return result;
  }
}
