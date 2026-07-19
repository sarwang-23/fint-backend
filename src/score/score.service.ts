import { Injectable, NotFoundException } from '@nestjs/common';
import { ScoreRepository } from './score.repository';
import { ScoreEngine } from './score.engine';

@Injectable()
export class ScoreService {
  constructor(
    private readonly repository: ScoreRepository,
    private readonly engine: ScoreEngine
  ) {}

  // For AI simulations and external calculations
  calculate(data: any) {
    return this.engine.calculateScore(data);
  }

  async calculateScore(userId: string) {
    const data = await this.repository.getUserFinancialData(userId);
    const scoreResult = this.calculate(data);

    // Save history
    const savedScore = await this.repository.saveScoreHistory(userId, scoreResult);

    return {
      ...savedScore,
      recommendations: this.generateRecommendations(savedScore.score, savedScore.factors)
    };
  }

  async getCurrentScore(userId: string) {
    const score = await this.repository.getLatestScore(userId);
    if (!score) {
      throw new NotFoundException('No score found. Please calculate your score first.');
    }
    return {
      ...score,
      recommendations: this.generateRecommendations(score.score, score.factors)
    };
  }

  async getScoreHistory(userId: string) {
    const history = await this.repository.getScoreHistory(userId);
    return history;
  }

  async recalculateScore(userId: string) {
    // Simply recalculate based on current data
    return this.calculateScore(userId);
  }

  private generateRecommendations(totalScore: number, factors: any[]) {
    const recommendations = [];

    if (totalScore < 50) {
      recommendations.push('Immediate Action Required: Your financial health is at critical risk. Focus on building an emergency fund and clearing high-interest debt.');
    } else if (totalScore < 75) {
      recommendations.push('Good Progress: You have a solid foundation but need to improve cash flow and savings rate.');
    } else {
      recommendations.push('Excellent: You are in great financial shape. Focus on wealth generation and diverse investments.');
    }

    factors.forEach(f => {
      if (f.score < 50) {
        if (f.pillar === 'Emergency Fund') recommendations.push('Action: Save at least 3-6 months of expenses in a liquid account.');
        if (f.pillar === 'Insurance Coverage') recommendations.push('Action: Purchase adequate Health and Term Life Insurance to protect your dependents.');
        if (f.pillar === 'Savings Rate') recommendations.push('Action: Try the 50/30/20 rule. Save at least 20% of your income.');
        if (f.pillar === 'Debt Health') recommendations.push('Action: Use the Debt Avalanche or Snowball method to reduce your EMI burden.');
      }
    });

    return recommendations;
  }
}
