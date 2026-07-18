
import { Injectable, NotFoundException } from '@nestjs/common';
import { LoanRepository } from './loan.repository';
import { CreateLoanDto } from './loan.dto';

@Injectable()
export class LoanService {
  constructor(private readonly loanRepository: LoanRepository) {}

  create(userId: string, dto: CreateLoanDto) {
    return this.loanRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.loanRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const loan = await this.loanRepository.findOne(id);
    if (!loan) {
      throw new NotFoundException(`Loan with id ${id} not found`);
    }
    return loan;
  }

  async update(id: string, dto: Partial<CreateLoanDto>) {
    await this.findOne(id);
    return this.loanRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.loanRepository.remove(id);
  }
}