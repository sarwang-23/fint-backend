import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
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
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './common/mail/mail.module';

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

    ScheduleModule.forRoot(),

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
    AiModule,
    AnalyticsModule,
    ReportsModule,
    NotificationsModule,
    UsersModule,
    AdminModule,
    MailModule,
  ],
})
export class AppModule {}