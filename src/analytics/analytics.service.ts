import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScoreService } from '../score/score.service';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreService: ScoreService,
  ) {}

  async getDashboardAnalytics(userId: string, timeRange: '1M' | '3M' | '6M' | '1Y' | 'ALL' = '6M') {
    const startDate = this.getStartDate(timeRange);

    const [
      incomes,
      expenses,
      assets,
      accounts,
      loans,
      investments,
      goals,
      scoreHistory
    ] = await Promise.all([
      this.prisma.income.findMany({ where: { userId, deletedAt: null, createdAt: { gte: startDate } } }),
      this.prisma.expense.findMany({ where: { userId, deletedAt: null, expenseDate: { gte: startDate } } }),
      this.prisma.asset.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.financialAccount.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.loan.findMany({ where: { userId, deletedAt: null, status: 'ACTIVE' } }),
      this.prisma.investment.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.financialGoal.findMany({ where: { userId, deletedAt: null } }),
      this.prisma.scoreHistory.findMany({ where: { userId, calculatedAt: { gte: startDate } }, orderBy: { calculatedAt: 'asc' } })
    ]);

    // 1. Monthly Summaries (Current Month vs Previous Month for trending)
    const currentMonthStart = dayjs().startOf('month').toDate();
    const prevMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const prevMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const currentMonthIncome = incomes.filter(i => dayjs(i.startDate || i.createdAt).isSameOrAfter(currentMonthStart)).reduce((acc, i) => acc + Number(i.amount), 0);
    const prevMonthIncome = incomes.filter(i => dayjs(i.startDate || i.createdAt).isSameOrAfter(prevMonthStart) && dayjs(i.startDate || i.createdAt).isSameOrBefore(prevMonthEnd)).reduce((acc, i) => acc + Number(i.amount), 0);
    
    const currentMonthExpense = expenses.filter(e => dayjs(e.expenseDate).isSameOrAfter(currentMonthStart)).reduce((acc, e) => acc + Number(e.amount), 0);
    const prevMonthExpense = expenses.filter(e => dayjs(e.expenseDate).isSameOrAfter(prevMonthStart) && dayjs(e.expenseDate).isSameOrBefore(prevMonthEnd)).reduce((acc, e) => acc + Number(e.amount), 0);

    const cashFlow = currentMonthIncome - currentMonthExpense;
    
    // 2. Net Worth Calculation
    const totalAssets = assets.reduce((acc, a) => acc + Number(a.currentValue), 0) 
      + accounts.reduce((acc, a) => acc + Number(a.currentBalance), 0)
      + investments.reduce((acc, i) => acc + (Number(i.currentPrice) * Number(i.quantity || 1)), 0);
    const totalLiabilities = loans.reduce((acc, l) => acc + Number(l.remainingBalance), 0);
    const netWorth = totalAssets - totalLiabilities;

    // 3. Trends & Charts Formatting
    const chartData = this.buildChartsData({ incomes, expenses, scoreHistory, investments, goals, startDate });

    // 4. Goal Progress
    const goalProgress = goals.map(g => ({
      id: g.id,
      title: g.title,
      target: Number(g.targetAmount),
      current: Number(g.currentAmount),
      progressPercentage: Math.min(100, Math.round((Number(g.currentAmount) / Number(g.targetAmount)) * 100)),
      status: g.status,
    }));

    return {
      summary: {
        monthlyIncome: { value: currentMonthIncome, trend: this.calculateTrend(currentMonthIncome, prevMonthIncome) },
        monthlyExpense: { value: currentMonthExpense, trend: this.calculateTrend(currentMonthExpense, prevMonthExpense) },
        cashFlow: cashFlow,
        netWorth: netWorth,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
      },
      charts: chartData,
      goals: goalProgress,
    };
  }

  private getStartDate(range: string): Date {
    switch (range) {
      case '1M': return dayjs().subtract(1, 'month').startOf('month').toDate();
      case '3M': return dayjs().subtract(3, 'month').startOf('month').toDate();
      case '6M': return dayjs().subtract(6, 'month').startOf('month').toDate();
      case '1Y': return dayjs().subtract(1, 'year').startOf('month').toDate();
      case 'ALL': return new Date(0); // Very old date
      default: return dayjs().subtract(6, 'month').startOf('month').toDate();
    }
  }

  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private buildChartsData(data: { incomes: any[], expenses: any[], scoreHistory: any[], investments: any[], goals: any[], startDate: Date }) {
    // A. Expense Categories (Pie Chart)
    const expenseCategories = data.expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
      return acc;
    }, {});
    const pieChart = Object.keys(expenseCategories).map(k => ({ name: k, value: expenseCategories[k] }));

    // B. Income vs Expense Trend (Area/Bar Chart) - Group by Month
    const monthlyGroups = {};
    data.incomes.forEach(i => {
      const monthYear = dayjs(i.startDate || i.createdAt).format('MMM YYYY');
      if (!monthlyGroups[monthYear]) monthlyGroups[monthYear] = { month: monthYear, income: 0, expense: 0, savings: 0 };
      monthlyGroups[monthYear].income += Number(i.amount);
      monthlyGroups[monthYear].savings = monthlyGroups[monthYear].income - monthlyGroups[monthYear].expense;
    });
    data.expenses.forEach(e => {
      const monthYear = dayjs(e.expenseDate).format('MMM YYYY');
      if (!monthlyGroups[monthYear]) monthlyGroups[monthYear] = { month: monthYear, income: 0, expense: 0, savings: 0 };
      monthlyGroups[monthYear].expense += Number(e.amount);
      monthlyGroups[monthYear].savings = monthlyGroups[monthYear].income - monthlyGroups[monthYear].expense;
    });
    
    // Sort chronologically (very basic sort since it's just strings like 'Jan 2026', better approach is sorting by date object)
    const areaChart = Object.values(monthlyGroups).sort((a: any, b: any) => dayjs(a.month, 'MMM YYYY').valueOf() - dayjs(b.month, 'MMM YYYY').valueOf());

    // C. Financial Score Trend (Line Chart)
    const scoreTrendLineChart = data.scoreHistory.map(s => ({
      date: dayjs(s.calculatedAt).format('MMM DD, YYYY'),
      score: Number(s.score)
    }));

    // D. Investment Growth (Bar Chart) - Just current snapshot vs bought
    const investmentBarChart = data.investments.map(i => ({
      name: i.name,
      investedAmount: Number(i.buyPrice) * Number(i.quantity || 1),
      currentValue: Number(i.currentPrice) * Number(i.quantity || 1)
    }));

    return {
      expenseCategories: pieChart, // Pie Chart
      cashFlowTrend: areaChart, // Area Chart / Bar Chart
      scoreTrend: scoreTrendLineChart, // Line Chart
      investmentGrowth: investmentBarChart, // Bar Chart
    };
  }
}
