
import { Injectable, NotFoundException } from '@nestjs/common';
import { FinancialGoalRepository } from './financial-goal.repository';
import { CreateFinancialGoalDto } from './financial-goal.dto';

@Injectable()
export class FinancialGoalService {
  constructor(private readonly financialGoalRepository: FinancialGoalRepository) {}

  create(userId: string, dto: CreateFinancialGoalDto) {
    return this.financialGoalRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.financialGoalRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const goal = await this.financialGoalRepository.findOne(id);
    if (!goal) {
      throw new NotFoundException(`Financial goal with id ${id} not found`);
    }
    return goal;
  }

  async update(id: string, dto: Partial<CreateFinancialGoalDto>) {
    await this.findOne(id);
    return this.financialGoalRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.financialGoalRepository.remove(id);
  }
}