import { Module } from '@nestjs/common';
import { RetirementService } from './retirement.service';
import { RetirementController } from './retirement.controller';
import { RetirementRepository } from './retirement.repository';

@Module({
  controllers: [RetirementController],
  providers: [RetirementService, RetirementRepository],
  exports: [RetirementService],
})
export class RetirementModule {}
