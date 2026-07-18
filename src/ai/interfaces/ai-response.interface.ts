export interface AIRecommendation {
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AIResponse {
  summary: string;
  recommendations: AIRecommendation[];
  riskLevel: string;
  score: number;
  nextSteps: string[];
}
