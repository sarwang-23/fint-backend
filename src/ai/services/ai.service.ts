import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecommendationService } from './recommendation.service';
import { ForecastService } from './forecast.service';
import { SimulationService } from './simulation.service';
import { PromptBuilderService } from './prompt-builder.service';
import { GeminiProvider } from '../providers/gemini.provider';
import { PrismaService } from '../../database/prisma.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { CacheService } from '../cache/cache.service';
import { UsageService } from '../usage/usage.service';
import { MemoryService } from '../memory/memory.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { getErrorMessage } from '../utils/error.util';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly forecastService: ForecastService,
    private readonly simulationService: SimulationService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly gemini: GeminiProvider,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly conversationRepo: ConversationRepository,
    private readonly cache: CacheService,
    private readonly usage: UsageService,
    private readonly memory: MemoryService,
    private readonly monitoring: MonitoringService,
    private readonly analytics: AnalyticsService,
  ) {}

  private createResponse(data: any, message: string) {
    return { success: true, data, message, timestamp: new Date().toISOString() };
  }

  private async checkUsage(userId: string) {
    const { allowed, remaining, limit } = await this.usage.isAllowed(userId);
    if (!allowed) {
      throw new HttpException(
        { message: 'Daily AI request limit reached. Upgrade to Premium for unlimited access.', remaining: 0, limit },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return { remaining, limit };
  }

  // 1. Recommendation
  async generateRecommendation(userId: string) {
    try {
      this.logger.log(`Recommendation request — User: ${userId}`);
      await this.checkUsage(userId);

      // Redis-compatible cache check
      const cacheKey = CacheService.buildKey('rec', userId);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.log(`Cache HIT for recommendation — User: ${userId}`);
        return this.createResponse(cached, 'Recommendation (Cached)');
      }

      const result = await this.recommendationService.generateRecommendation(userId);

      await this.cache.set(cacheKey, result, CacheService.TTL_RECOMMENDATION);
      return this.createResponse(result, 'Recommendation Generated Successfully');
    } catch (error) {
      this.logger.error(`Recommendation failed — ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to generate recommendation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 2. Forecast
  async generateForecast(userId: string, years: number = 5) {
    try {
      this.logger.log(`Forecast request — User: ${userId} (${years} years)`);
      await this.checkUsage(userId);

      const cacheKey = CacheService.buildKey(`forecast:${years}`, userId);
      const cached = await this.cache.get(cacheKey);
      if (cached) return this.createResponse(cached, 'Forecast (Cached)');

      const result = await this.forecastService.generateForecast(userId, years);
      await this.cache.set(cacheKey, result, CacheService.TTL_FORECAST);
      return this.createResponse(result, 'Forecast Generated Successfully');
    } catch (error) {
      this.logger.error(`Forecast failed — ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to generate forecast', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 3. Simulation (no cache — always on-demand)
  async generateSimulation(userId: string, scenarioData: any) {
    try {
      this.logger.log(`Simulation request — User: ${userId}`);
      await this.checkUsage(userId);
      const result = await this.simulationService.generateSimulation(userId, scenarioData);
      return this.createResponse(result, 'Simulation Generated Successfully');
    } catch (error) {
      this.logger.error(`Simulation failed — ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to generate simulation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 4. Chat — with conversation persistence
  async chat(userId: string, question: string) {
    try {
      this.logger.log(`Chat request — User: ${userId}`);
      await this.checkUsage(userId);

      const provider = this.configService.get<string>('AI_PROVIDER') || 'gemini';
      const prompt = this.promptBuilder.buildAdvisorPrompt(question);
      const answer = await this.gemini.generate(prompt);

      await this.conversationRepo.create({ userId, question, answer, provider });
      return this.createResponse({ answer }, 'Chat Response Generated');
    } catch (error) {
      this.logger.error(`Chat failed — ${userId}: ${getErrorMessage(error)}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException('AI Chat Service Unavailable', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 5. Health check
  async health() {
    this.logger.log('AI Health Check');
    const status = await this.monitoring.getHealthStatus();
    return this.createResponse(status, 'Health Check Completed');
  }

  // 6. Monitoring Dashboard (Admin)
  async getDashboard() {
    const data = await this.monitoring.getDashboard();
    return this.createResponse(data, 'Monitoring Dashboard');
  }

  // 7. User Usage Stats
  async getUsageStats(userId: string) {
    const stats = await this.usage.getStats(userId);
    return this.createResponse(stats, 'Usage Statistics');
  }

  // 8. Analytics
  async getAnalytics() {
    const data = await this.analytics.getFeatureAnalytics();
    return this.createResponse(data, 'Feature Analytics');
  }
}
