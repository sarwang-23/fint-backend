import { Module } from '@nestjs/common';
import { FinancialAccountService } from './financial-account.service';
import { FinancialAccountController } from './financial-account.controller';
import { FinancialAccountRepository } from './financial-account.repository';

@Module({
  controllers: [FinancialAccountController],
  providers: [FinancialAccountService, FinancialAccountRepository],
  exports: [FinancialAccountService],
})
export class FinancialAccountModule {}
