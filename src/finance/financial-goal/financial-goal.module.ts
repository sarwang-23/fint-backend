import { Module } from '@nestjs/common';
import { FinancialGoalService } from './financial-goal.service';
import { FinancialGoalController } from './financial-goal.controller';
import { FinancialGoalRepository } from './financial-goal.repository';

@Module({
  controllers: [FinancialGoalController],
  providers: [FinancialGoalService, FinancialGoalRepository],
  exports: [FinancialGoalService],
})
export class FinancialGoalModule {}
