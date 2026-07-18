import { Injectable } from '@nestjs/common';
import { PillarResult } from '../interfaces/score.interface';
import { HEALTHY_PILLAR_THRESHOLD } from '../../constants/score.constants';

/**
 * Deterministic, rule-based tips derived straight from pillar scores.
 * This is intentionally separate from the AI module's LLM-generated
 * recommendations: it needs no external API call, so the user always gets
 * *some* actionable feedback immediately when their score is calculated,
 * even before/without the AI Engine being wired up.
 */
@Injectable()
export class RecommendationService {
  generate(pillars: PillarResult[]): string[] {
    return pillars
      .filter((p) => p.score < HEALTHY_PILLAR_THRESHOLD)
      .sort((a, b) => a.score - b.score)
      .map((p) => this.tipFor(p));
  }

  private tipFor(p: PillarResult): string {
    const tips: Record<string, string> = {
      'Income Stability': 'Consider adding another income source or moving toward more recurring income.',
      'Cash Flow': 'Your expenses are eating into your income — review discretionary spending to widen your monthly surplus.',
      'Debt Health': 'Your EMI burden is high relative to income — prioritise paying down high-interest loans first.',
      'Credit Health': 'Keep loan repayments on schedule to avoid defaults, which weigh heavily on this pillar.',
      'Savings': 'Build up liquid savings — aim to save a consistent percentage of income each month.',
      'Emergency Fund': `Your emergency fund covers fewer months of expenses than recommended — top it up before investing further.`,
      'Insurance Protection': 'Add or increase health and life insurance coverage relative to your income.',
      'Investments': 'Diversify across more investment types and increase invested value relative to income.',
      'Retirement Readiness': 'Increase your monthly retirement contribution or set up a retirement plan if you haven\'t already.',
      'Financial Behaviour': 'Keep your financial profile up to date across all categories and set active goals to track progress.',
    };
    return tips[p.pillar] ?? `Improve your ${p.pillar} pillar (currently ${p.score}/100).`;
  }
}
