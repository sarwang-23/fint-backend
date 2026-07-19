import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { IncomeModule } from './finance/income/income.module';
import { ExpenseModule } from './finance/expense/expense.module';
import { LoanModule } from './finance/loan/loan.module';
import { InvestmentModule } from './finance/investment/investment.module';
import { InsuranceModule } from './finance/insurance/insurance.module';
import { RetirementModule } from './finance/retirement/retirement.module';
import { AssetModule } from './finance/asset/asset.module';
import { FinancialGoalModule } from './finance/financial-goal/financial-goal.module';
import { FinancialAccountModule } from './finance/financial-account/financial-account.module';
import { ScoreModule } from './score/score.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    DatabaseModule,

    AuthModule,
    IncomeModule,
    ExpenseModule,
    LoanModule,
    InvestmentModule,
    InsuranceModule,
    RetirementModule,
    AssetModule,
    FinancialGoalModule,
    FinancialAccountModule,
    ScoreModule,
    UsersModule,
    NotificationsModule,
  ],
})
export class AppModule {}