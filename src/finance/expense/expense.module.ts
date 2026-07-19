import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { ExpenseRepository } from './expense.repository';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService, ExpenseRepository],
  exports: [ExpenseService],
})
export class ExpenseModule {}
