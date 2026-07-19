import { Module } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import { InsuranceRepository } from './insurance.repository';

@Module({
  controllers: [InsuranceController],
  providers: [InsuranceService, InsuranceRepository],
  exports: [InsuranceService],
})
export class InsuranceModule {}
