import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface MemoryContext {
  previousRecommendations: string[];
  previousRiskLevel: string | null;
  advisedActions: string[];
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load last N recommendations for context building.
   * Avoids repeating the same advice.
   */
  async buildContext(userId: string, limit = 5): Promise<MemoryContext> {
    const history = await this.prisma.aIRecommendation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (!history.length) {
      return { previousRecommendations: [], previousRiskLevel: null, advisedActions: [] };
    }

    const advisedActions: string[] = [];
    const titles: string[] = [];

    for (const rec of history) {
      const items = rec.recommendations as any[];
      if (Array.isArray(items)) {
        items.forEach((r) => {
          if (r?.title) titles.push(r.title);
          if (r?.description) advisedActions.push(r.description);
        });
      }
    }

    const latestRiskLevel = history[0]?.riskLevel ?? null;

    this.logger.log(`Memory context built for user ${userId}: ${titles.length} past recommendations loaded`);

    return {
      previousRecommendations: [...new Set(titles)], // deduplicate
      previousRiskLevel: latestRiskLevel,
      advisedActions: [...new Set(advisedActions)],
    };
  }

  /**
   * Append memory context to an existing prompt.
   * This prevents AI from repeating already-given advice.
   */
  appendMemoryToPrompt(prompt: string, context: MemoryContext): string {
    if (!context.previousRecommendations.length) return prompt;

    const memoryBlock = `
PREVIOUS ADVICE HISTORY (Do NOT repeat these):
${context.previousRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Previous Risk Level: ${context.previousRiskLevel || 'Unknown'}

Build upon the previous advice. If the user has already been told to increase SIP, check if they might have done it and suggest the next logical step instead.
`;
    return prompt + memoryBlock;
  }
}
