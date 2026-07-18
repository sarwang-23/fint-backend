import { Module } from '@nestjs/common';
import { ScoreController } from './controllers/score.controller';
import { ScoreService } from './services/score.service';
import { CalculationService } from './services/calculation.service';
import { RecommendationService } from './services/recommendation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ScoreController],
  providers: [ScoreService, CalculationService, RecommendationService],
  exports: [ScoreService],
})
export class ScoreModule {}
