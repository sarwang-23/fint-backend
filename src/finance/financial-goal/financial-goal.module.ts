
import { Module } from '@nestjs/common';
import { FinancialGoalController } from './financial-goal.controller';
import { FinancialGoalService } from './financial-goal.service';
import { FinancialGoalRepository } from './financial-goal.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FinancialGoalController],
  providers: [FinancialGoalService, FinancialGoalRepository],
  exports: [FinancialGoalService],
})
export class FinancialGoalModule {}