
import { Module } from '@nestjs/common';
import { IncomeController } from './income.controller';
import { IncomeService } from './income.service';
import { IncomeRepository } from './income.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IncomeController],
  providers: [IncomeService, IncomeRepository],
  exports: [IncomeService],
})
export class IncomeModule {
}