import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseRepository } from './expense.repository';
import { CreateExpenseDto } from './expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  create(userId: string, dto: CreateExpenseDto) {
    return this.expenseRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.expenseRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const expense = await this.expenseRepository.findOne(id);
    if (!expense) {
      throw new NotFoundException(`Expense with id ${id} not found`);
    }
    return expense;
  }

  async update(id: string, dto: Partial<CreateExpenseDto>) {
    await this.findOne(id);
    return this.expenseRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.expenseRepository.remove(id);
  }
}