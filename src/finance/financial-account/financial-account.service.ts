
import { Injectable, NotFoundException } from '@nestjs/common';
import { FinancialAccountRepository } from './financial-account.repository';
import { CreateFinancialAccountDto } from './financial-account.dto';

@Injectable()
export class FinancialAccountService {
  constructor(private readonly financialAccountRepository: FinancialAccountRepository) {}

  create(userId: string, dto: CreateFinancialAccountDto) {
    return this.financialAccountRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.financialAccountRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const account = await this.financialAccountRepository.findOne(id);
    if (!account) {
      throw new NotFoundException(`Financial account with id ${id} not found`);
    }
    return account;
  }

  async update(id: string, dto: Partial<CreateFinancialAccountDto>) {
    await this.findOne(id);
    return this.financialAccountRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.financialAccountRepository.remove(id);
  }
}