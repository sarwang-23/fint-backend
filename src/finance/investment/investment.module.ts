import { Module } from '@nestjs/common';
import { InvestmentService } from './investment.service';
import { InvestmentController } from './investment.controller';
import { InvestmentRepository } from './investment.repository';

@Module({
  controllers: [InvestmentController],
  providers: [InvestmentService, InvestmentRepository],
  exports: [InvestmentService],
})
export class InvestmentModule {}
