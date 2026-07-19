import { Module } from '@nestjs/common';
import { ScoreController } from './score.controller';
import { ScoreService } from './score.service';
import { ScoreEngine } from './score.engine';
import { ScoreRepository } from './score.repository';

@Module({
  controllers: [ScoreController],
  providers: [ScoreService, ScoreEngine, ScoreRepository],
  exports: [ScoreService, ScoreEngine, ScoreRepository]
})
export class ScoreModule {}

