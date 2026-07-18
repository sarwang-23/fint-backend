import { Injectable, Logger } from '@nestjs/common';

// Feature flag registry — easily controlled from config/database in the future
const FLAGS: Record<string, boolean> = {
  SIMULATION: true,
  FORECAST: true,
  RECOMMENDATION: true,
  CHAT: true,
  AI_MEMORY: true,
  COST_TRACKING: true,
  BETA_SIMULATION_V2: false, // beta — disabled by default
};

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  isEnabled(feature: string): boolean {
    const enabled = FLAGS[feature] ?? false;
    if (!enabled) {
      this.logger.warn(`Feature flag DISABLED: ${feature}`);
    }
    return enabled;
  }

  getAll(): Record<string, boolean> {
    return { ...FLAGS };
  }
}
