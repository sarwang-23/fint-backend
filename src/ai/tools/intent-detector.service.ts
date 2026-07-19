import { Injectable, Logger } from '@nestjs/common';
import { ChatIntent } from '../interfaces/chat-context.interface';

// Keyword maps for intent detection
const INTENT_KEYWORDS: Record<ChatIntent, string[]> = {
  SIMULATION: ['what if', 'agar', 'kya hoga', 'suppose', 'if i', 'if my salary', 'increase sip by', 'reduce emi', 'prepay', 'what happens if'],
  FORECAST: ['future', 'years', 'projection', 'retire', 'retirement', 'long term', 'corpus', 'bhavishya', 'baad mein', 'growth'],
  RECOMMENDATION: ['recommend', 'advice', 'suggest', 'should i', 'kya karna', 'best way', 'kya sahi', 'help me'],
  SCORE: ['score', 'rating', 'fint score', 'financial health', 'kitna score', 'grade'],
  LOAN: ['loan', 'emi', 'debt', 'borrow', 'karj', 'home loan', 'car loan', 'personal loan', 'prepay'],
  INVESTMENT: ['invest', 'sip', 'mutual fund', 'stocks', 'equity', 'portfolio', 'fd', 'etf', 'nps', 'ppf'],
  INSURANCE: ['insurance', 'policy', 'cover', 'term plan', 'health insurance', 'bima'],
  RETIREMENT: ['retire', 'retirement', 'pension', 'old age', 'corpus', '60 saal'],
  GOAL: ['goal', 'house', 'car', 'marriage', 'education', 'vacation', 'target', 'lakshya'],
  BUDGET: ['budget', 'budget plan', 'spending plan', 'kitna kharcha', '50 30 20', 'monthly budget', 'allocate'],
  EXPENSE_ANALYSIS: ['expense analysis', 'spending analysis', 'where am i spending', 'kahan ja raha', 'spending pattern', 'analyze expense'],
  SAVINGS: ['save', 'saving', 'bachao', 'emergency fund', 'how much to save', 'savings rate', 'savings goal'],
  RISK_ANALYSIS: ['risk', 'risk profile', 'how risky', 'financial risk', 'net worth', 'protection', 'risk analysis'],
  GENERAL_QUESTION: [], // fallback
};

@Injectable()
export class IntentDetectorService {
  private readonly logger = new Logger(IntentDetectorService.name);

  detect(message: string): ChatIntent {
    const lower = message.toLowerCase();

    // Priority order matters — SIMULATION first (most specific)
    const priorityOrder: ChatIntent[] = [
      'SIMULATION', 'FORECAST', 'SCORE', 'EXPENSE_ANALYSIS', 'BUDGET', 'SAVINGS',
      'RISK_ANALYSIS', 'LOAN', 'INVESTMENT', 'INSURANCE', 'RETIREMENT', 'GOAL',
      'RECOMMENDATION', 'GENERAL_QUESTION',
    ];

    for (const intent of priorityOrder) {
      const keywords = INTENT_KEYWORDS[intent];
      if (keywords.some((kw) => lower.includes(kw))) {
        this.logger.log(`Intent detected: ${intent} for message: "${message.slice(0, 50)}"`);
        return intent;
      }
    }

    this.logger.log(`Fallback intent: GENERAL_QUESTION`);
    return 'GENERAL_QUESTION';
  }
}
