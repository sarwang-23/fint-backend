import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';
import { IncomeRepository } from './income.repository';

@Module({
  controllers: [IncomeController],
  providers: [IncomeService, IncomeRepository],
  exports: [IncomeService],
})
export class IncomeModule {}
