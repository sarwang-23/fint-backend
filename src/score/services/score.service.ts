import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CalculationService } from './calculation.service';
import { RecommendationService } from './recommendation.service';
import { ScoreInputData } from '../interfaces/score.interface';
import { ScoreHistoryEntity } from '../entities/score.entity';

@Injectable()
export class ScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculationService: CalculationService,
    private readonly recommendationService: RecommendationService,
  ) {}

  /**
   * Pulls the user's full financial profile, computes the weighted FINT
   * Score, persists it as a new ScoreHistory + ScoreFactor rows (so the
   * score is tracked over time, per the Phase 4 "Monthly Tracking" spec),
   * and returns the breakdown plus rule-based recommendations.
   */
  async calculateAndSave(userId: string): Promise<ScoreHistoryEntity> {
    const inputData = await this.gatherInputData(userId);
    const breakdown = this.calculationService.calculate(inputData);
    const recommendations = this.recommendationService.generate(breakdown.pillars);

    const saved = await this.prisma.scoreHistory.create({
      data: {
        userId,
        score: breakdown.totalScore,
        grade: breakdown.grade,
        risk: breakdown.risk,
        factors: {
          create: breakdown.pillars.map((p) => ({
            pillar: p.pillar,
            weight: p.weight,
            score: p.score,
            remarks: p.remarks,
          })),
        },
      },
      include: { factors: true },
    });

    return { ...saved, recommendations };
  }

  async getLatest(userId: string): Promise<ScoreHistoryEntity | null> {
    return this.prisma.scoreHistory.findFirst({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      include: { factors: true },
    });
  }

  async getHistory(userId: string, limit = 10) {
    return this.prisma.scoreHistory.findMany({
      where: { userId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
      include: { factors: true },
    });
  }

  private async gatherInputData(userId: string): Promise<ScoreInputData> {
    const [incomes, expenses, assets, loans, investments, insurances, retirement, goals] =
      await Promise.all([
        this.prisma.income.findMany({ where: { userId } }),
        this.prisma.expense.findMany({ where: { userId } }),
        this.prisma.asset.findMany({ where: { userId } }),
        this.prisma.loan.findMany({ where: { userId } }),
        this.prisma.investment.findMany({ where: { userId } }),
        this.prisma.insurance.findMany({ where: { userId } }),
        this.prisma.retirement.findUnique({ where: { userId } }),
        this.prisma.financialGoal.findMany({ where: { userId } }),
      ]);

    return {
      incomes: incomes.map((i) => ({ amount: Number(i.amount), frequency: i.frequency })),
      expenses: expenses.map((e) => ({ amount: Number(e.amount), expenseDate: e.expenseDate })),
      assets: assets.map((a) => ({ assetType: a.assetType, currentValue: Number(a.currentValue) })),
      loans: loans.map((l) => ({ emiAmount: Number(l.emiAmount), status: l.status })),
      investments: investments.map((i) => ({
        investmentType: i.investmentType,
        quantity: i.quantity ? Number(i.quantity) : null,
        currentPrice: Number(i.currentPrice),
      })),
      insurances: insurances.map((i) => ({
        insuranceType: i.insuranceType,
        coverageAmount: Number(i.coverageAmount),
      })),
      retirement: retirement
        ? {
            targetRetirementAge: retirement.targetRetirementAge,
            currentAge: retirement.currentAge,
            currentSavings: Number(retirement.currentSavings),
            targetCorpus: Number(retirement.targetCorpus),
            monthlyContribution: Number(retirement.monthlyContribution),
            expectedReturnRate: Number(retirement.expectedReturnRate),
          }
        : null,
      goals: goals.map((g) => ({ status: g.status })),
    };
  }
}
