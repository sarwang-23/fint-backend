import { Injectable, NotFoundException } from '@nestjs/common';
import { IncomeRepository } from './income.repository';
import { CreateIncomeDto } from './income.dto';

@Injectable()
export class IncomeService {
  constructor(private readonly incomeRepository: IncomeRepository) {}

  create(userId: string, dto: CreateIncomeDto) {
    return this.incomeRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.incomeRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const income = await this.incomeRepository.findOne(id);
    if (!income) {
      throw new NotFoundException(`Income with id ${id} not found`);
    }
    return income;
  }

  async update(id: string, dto: Partial<CreateIncomeDto>) {
    await this.findOne(id); // throws 404 if it doesn't exist
    return this.incomeRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // throws 404 if it doesn't exist
    return this.incomeRepository.remove(id);
  }
}