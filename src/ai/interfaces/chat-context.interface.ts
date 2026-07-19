export type ChatIntent =
  | 'GENERAL_QUESTION'
  | 'RECOMMENDATION'
  | 'FORECAST'
  | 'SIMULATION'
  | 'SCORE'
  | 'GOAL'
  | 'LOAN'
  | 'INVESTMENT'
  | 'INSURANCE'
  | 'RETIREMENT'
  | 'BUDGET'
  | 'EXPENSE_ANALYSIS'
  | 'SAVINGS'
  | 'RISK_ANALYSIS';


export interface ChatContext {
  userId: string;
  income: number;
  expense: number;
  loan: number;
  investment: number;
  insurance: boolean;
  score: number;
  goals: string[];
  previousRecommendations: string[];
  conversationHistory: { role: 'user' | 'ai'; content: string }[];
}
