import { Injectable } from '@nestjs/common';
import { RECOMMENDATION_PROMPT } from '../prompts/recommendation.prompt';
import { FORECAST_PROMPT } from '../prompts/forecast.prompt';
import { SIMULATION_PROMPT } from '../prompts/simulation.prompt';
import { ADVISOR_PROMPT } from '../prompts/advisor.prompt';

@Injectable()
export class PromptBuilderService {
  
  buildRecommendationPrompt(data: {
    income: number;
    expense: number;
    loan: number;
    investment: number;
    insurance: boolean;
    score: number;
  }): string {
    let prompt = RECOMMENDATION_PROMPT;
    prompt = prompt.replace('{{income}}', data.income.toString());
    prompt = prompt.replace('{{expense}}', data.expense.toString());
    prompt = prompt.replace('{{loan}}', data.loan.toString());
    prompt = prompt.replace('{{investment}}', data.investment.toString());
    prompt = prompt.replace('{{insurance}}', data.insurance ? 'YES' : 'NO');
    prompt = prompt.replace(/{{score}}/g, data.score.toString());
    return prompt;
  }

  buildForecastPrompt(data: {
    futureValue: number;
    retirementCorpus: number;
    emergencyFund: number;
    debtRatio: number;
    savingRate: number;
  }): string {
    let prompt = FORECAST_PROMPT;
    prompt = prompt.replace(/{{futureValue}}/g, data.futureValue.toString());
    prompt = prompt.replace('{{retirementCorpus}}', data.retirementCorpus.toString());
    prompt = prompt.replace('{{emergencyFund}}', data.emergencyFund.toString());
    prompt = prompt.replace('{{debtRatio}}', data.debtRatio.toString());
    prompt = prompt.replace('{{savingRate}}', data.savingRate.toString());
    return prompt;
  }

  buildSimulationPrompt(data: {
    oldScore: number;
    newScore: number;
    changes: string;
  }): string {
    let prompt = SIMULATION_PROMPT;
    prompt = prompt.replace(/{{oldScore}}/g, data.oldScore.toString());
    prompt = prompt.replace(/{{newScore}}/g, data.newScore.toString());
    prompt = prompt.replace('{{changes}}', data.changes);
    return prompt;
  }

  buildAdvisorPrompt(question: string): string {
    let prompt = ADVISOR_PROMPT;
    prompt = prompt.replace('{{question}}', question);
    return prompt;
  }
}
