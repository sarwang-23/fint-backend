
import { Module } from '@nestjs/common';
import { FinancialAccountController } from './financial-account.controller';
import { FinancialAccountService } from './financial-account.service';
import { FinancialAccountRepository } from './financial-account.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FinancialAccountController],
  providers: [FinancialAccountService, FinancialAccountRepository],
  exports: [FinancialAccountService],
})
export class FinancialAccountModule {}