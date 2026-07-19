import { Injectable, Logger } from '@nestjs/common';
import { ChatContext, ChatIntent } from '../interfaces/chat-context.interface';
import { RecommendationService } from '../services/recommendation.service';
import { ForecastService } from '../services/forecast.service';
import { SimulationService } from '../services/simulation.service';
import { ScoreService } from '../../score/score.service';
import { AdvisoryService } from '../services/advisory.service';
import { getErrorMessage } from '../utils/error.util';

export interface ToolResult {
  toolUsed: string;
  data: any;
}

@Injectable()
export class ToolRouterService {
  private readonly logger = new Logger(ToolRouterService.name);

  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly forecastService: ForecastService,
    private readonly simulationService: SimulationService,
    private readonly scoreService: ScoreService,
    private readonly advisoryService: AdvisoryService,
  ) {}

  async route(intent: ChatIntent, ctx: ChatContext, message: string): Promise<ToolResult | null> {
    this.logger.log(`Routing intent ${intent} for user ${ctx.userId}`);

    try {
      switch (intent) {
        case 'RECOMMENDATION':
          const rec = await this.recommendationService.generateRecommendation(ctx.userId);
          return { toolUsed: 'RecommendationTool', data: rec };

        case 'FORECAST':
          const years = this.extractYears(message);
          const forecast = await this.forecastService.generateForecast(ctx.userId, years);
          return { toolUsed: 'ForecastTool', data: forecast };

        case 'SIMULATION':
          const scenario = this.extractSimulationScenario(message, ctx);
          if (scenario) {
            const sim = await this.simulationService.generateSimulation(ctx.userId, scenario);
            return { toolUsed: 'SimulationTool', data: sim };
          }
          return null;

        case 'SCORE':
          const scoreResult = this.scoreService.calculate({
            income: ctx.income,
            expense: ctx.expense,
            investment: ctx.investment,
            loan: ctx.loan,
          });
          const score = scoreResult.score;
          return { toolUsed: 'ScoreTool', data: { score, label: this.getScoreLabel(score) } };

        case 'BUDGET':
          const budgetData = await this.advisoryService.getBudgetSuggestions(ctx.userId);
          return { toolUsed: 'BudgetTool', data: budgetData };

        case 'EXPENSE_ANALYSIS':
          const expenseData = await this.advisoryService.analyzeSpending(ctx.userId);
          return { toolUsed: 'ExpenseAnalysisTool', data: expenseData };

        case 'SAVINGS':
          const savingsData = await this.advisoryService.getSavingsRecommendations(ctx.userId);
          return { toolUsed: 'SavingsTool', data: savingsData };

        case 'RISK_ANALYSIS':
          const riskData = await this.advisoryService.analyzeRisk(ctx.userId);
          return { toolUsed: 'RiskAnalysisTool', data: riskData };

        default:
          return null;
      }
    } catch (error) {
      this.logger.error(`Tool execution failed for intent ${intent}: ${getErrorMessage(error)}`);
      return null;
    }
  }

  private extractYears(message: string): number {
    const match = message.match(/(\d+)\s*(year|saal|yr)/i);
    return match ? parseInt(match[1]) : 5;
  }

  private extractSimulationScenario(message: string, ctx: ChatContext): any {
    const lower = message.toLowerCase();

    // Investment increase
    const sipMatch = message.match(/(?:sip|invest(?:ment)?)\s*(?:by|se)?\s*₹?\s*(\d+)/i);
    if (sipMatch) return { scenarioType: 'INVESTMENT', investmentIncrease: parseInt(sipMatch[1]) };

    // EMI reduction
    const emiMatch = message.match(/emi\s*(?:reduce|kam|decrease).*?₹?\s*(\d+)/i) ||
                     message.match(/₹?\s*(\d+).*?emi/i);
    if (lower.includes('emi') && emiMatch) {
      const newEmi = parseInt(emiMatch[1]);
      const reduction = ctx.loan - newEmi;
      if (reduction > 0) return { scenarioType: 'EXPENSE', expenseReduction: reduction };
    }

    // Loan prepay
    const prepayMatch = message.match(/prepay.*?₹?\s*([\d,]+)/i);
    if (prepayMatch) return { scenarioType: 'LOAN', loanPrepayment: parseInt(prepayMatch[1].replace(/,/g, '')) };

    // Salary increase
    const salaryMatch = message.match(/salary.*?(\d+)%/i) || message.match(/income.*?₹?\s*([\d,]+)/i);
    if (salaryMatch && lower.includes('increas')) {
      const pct = parseInt(salaryMatch[1]);
      const increase = pct > 100 ? pct : Math.round((ctx.income * pct) / 100);
      return { scenarioType: 'INCOME', salaryIncrease: increase };
    }

    // Expense reduction
    const expMatch = message.match(/(?:expense|kharch).*?₹?\s*([\d,]+)/i);
    if (expMatch && (lower.includes('reduc') || lower.includes('kam') || lower.includes('decreas'))) {
      return { scenarioType: 'EXPENSE', expenseReduction: parseInt(expMatch[1].replace(/,/g, '')) };
    }

    return null;
  }

  private getScoreLabel(score: number): string {
    if (score >= 800) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 600) return 'Fair';
    if (score >= 500) return 'Poor';
    return 'Critical';
  }
}
