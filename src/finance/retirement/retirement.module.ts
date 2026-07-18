
import { Module } from '@nestjs/common';
import { RetirementController } from './retirement.controller';
import { RetirementService } from './retirement.service';
import { RetirementRepository } from './retirement.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RetirementController],
  providers: [RetirementService, RetirementRepository],
  exports: [RetirementService],
})
export class RetirementModule {}