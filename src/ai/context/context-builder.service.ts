import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ChatContext } from '../interfaces/chat-context.interface';

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build a complete financial context for a user.
   * Fetches all financial data + recent conversation history.
   */
  async build(userId: string): Promise<ChatContext> {
    const [incomes, expenses, loans, investments, insurances, scoreHistory, goals, pastConversations, pastRecs] =
      await Promise.all([
        this.prisma.income.findMany({ where: { userId } }),
        this.prisma.expense.findMany({ where: { userId } }),
        this.prisma.loan.findMany({ where: { userId, status: 'ACTIVE' } }),
        this.prisma.investment.findMany({ where: { userId } }),
        this.prisma.insurance.findMany({ where: { userId } }),
        this.prisma.scoreHistory.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        this.prisma.financialGoal.findMany({ where: { userId, status: 'ACTIVE' } }),
        // Last 10 messages for context window
        this.prisma.aIConversation.findMany({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        // Last 3 recommendations for memory
        this.prisma.aIRecommendation.findMany({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
      ]);

    const income = incomes.reduce((a, i) => a + Number(i.amount), 0);
    const expense = expenses.reduce((a, e) => a + Number(e.amount), 0);
    const loan = loans.reduce((a, l) => a + Number(l.emiAmount), 0);
    const investment = investments.reduce((a, i) => a + Number(i.currentPrice), 0);
    const insurance = insurances.length > 0;
    const score = scoreHistory?.score ?? 0;
    const goalTitles = goals.map((g) => g.title);

    // Flatten past recommendations titles
    const previousRecommendations: string[] = [];
    for (const rec of pastRecs) {
      const items = rec.recommendations as any[];
      if (Array.isArray(items)) items.forEach((r) => r?.title && previousRecommendations.push(r.title));
    }

    // Build conversation history (reverse to chronological order)
    const conversationHistory = pastConversations
      .reverse()
      .flatMap((c) => [
        { role: 'user' as const, content: c.question },
        { role: 'ai' as const, content: c.answer },
      ]);

    this.logger.log(`Context built for user ${userId} — ${conversationHistory.length} history messages`);

    return {
      userId,
      income,
      expense,
      loan,
      investment,
      insurance,
      score,
      goals: goalTitles,
      previousRecommendations: [...new Set(previousRecommendations)],
      conversationHistory,
    };
  }

  /**
   * Serialize the context into a readable financial summary string for the prompt.
   */
  toSummaryString(ctx: ChatContext): string {
    const savings = ctx.income - ctx.expense;
    const debtRatio = ctx.income > 0 ? ((ctx.loan / ctx.income) * 100).toFixed(1) : '0';

    return `
CURRENT FINANCIAL PROFILE:
- Monthly Income: ₹${ctx.income}
- Monthly Expense: ₹${ctx.expense}
- Monthly Savings: ₹${savings}
- Loan EMI: ₹${ctx.loan}
- Debt Ratio: ${debtRatio}%
- Investment Corpus: ₹${ctx.investment}
- Insurance: ${ctx.insurance ? 'Yes' : 'No'}
- FINT Score: ${ctx.score}
- Active Goals: ${ctx.goals.length > 0 ? ctx.goals.join(', ') : 'None'}

PREVIOUS AI ADVICE (Do NOT repeat):
${ctx.previousRecommendations.length > 0 ? ctx.previousRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'None yet'}

RECENT CONVERSATION:
${
  ctx.conversationHistory.length > 0
    ? ctx.conversationHistory.map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n')
    : 'No previous messages'
}
`.trim();
  }
}
