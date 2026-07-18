import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { AiController } from './controllers/ai.controller';
import { ChatController } from './chat/chat.controller';

// Core Services
import { AiService } from './services/ai.service';
import { RecommendationService } from './services/recommendation.service';
import { ForecastService } from './services/forecast.service';
import { SimulationService } from './services/simulation.service';
import { PromptBuilderService } from './services/prompt-builder.service';

// AI Provider
import { GeminiProvider } from './providers/gemini.provider';

// Calculators
import { FutureValueCalculator } from './calculators/future-value.calculator';
import { RetirementCalculator } from './calculators/retirement.calculator';
import { DebtCalculator } from './calculators/debt.calculator';
import { EmergencyFundCalculator } from './calculators/emergency-fund.calculator';

// Repositories
import { RecommendationRepository } from './repositories/recommendation.repository';
import { ForecastRepository } from './repositories/forecast.repository';
import { SimulationRepository } from './repositories/simulation.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

// Phase 10 — Enterprise Services
import { CacheService } from './cache/cache.service';
import { MemoryService } from './memory/memory.service';
import { UsageService } from './usage/usage.service';
import { MonitoringService } from './monitoring/monitoring.service';
import { AnalyticsService } from './analytics/analytics.service';
import { MetricsService } from './metrics/metrics.service';
import { NotificationService } from './notifications/notification.service';
import { FeatureFlagService } from './utils/feature-flag.service';
import { CostTrackingService } from './usage/cost-tracking.service';
import { PromptSanitizerService } from './utils/prompt-sanitizer.service';

// Background Jobs
import { RecommendationJob } from './jobs/recommendation.job';
import { ForecastJob } from './jobs/forecast.job';

// Phase 11 — AI Copilot (Chat System)
import { ChatService } from './chat/chat.service';
import { ConversationService } from './conversation/conversation.service';
import { ContextBuilderService } from './context/context-builder.service';
import { IntentDetectorService } from './tools/intent-detector.service';
import { ToolRouterService } from './tools/tool-router.service';

// External
import { ScoreService } from '../score/services/score.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    // DatabaseModule is @Global() — PrismaService injected automatically
  ],
  controllers: [
    AiController,
    ChatController,   // Phase 11
  ],
  providers: [
    // Core
    AiService,
    RecommendationService,
    ForecastService,
    SimulationService,
    PromptBuilderService,

    // AI Provider
    GeminiProvider,

    // Calculators
    FutureValueCalculator,
    RetirementCalculator,
    DebtCalculator,
    EmergencyFundCalculator,

    // Repositories
    RecommendationRepository,
    ForecastRepository,
    SimulationRepository,
    ConversationRepository,
    AuditLogRepository,

    // Enterprise (Phase 10)
    CacheService,
    MemoryService,
    UsageService,
    MonitoringService,
    AnalyticsService,
    MetricsService,
    NotificationService,
    FeatureFlagService,
    CostTrackingService,   // Phase 12
    PromptSanitizerService, // Phase 12

    // Background Jobs
    RecommendationJob,
    ForecastJob,

    // AI Copilot (Phase 11)
    ChatService,
    ConversationService,
    ContextBuilderService,
    IntentDetectorService,
    ToolRouterService,

    // External
    ScoreService,
  ],
  exports: [AiService, UsageService, AnalyticsService, ChatService],
})
export class AiModule {}
