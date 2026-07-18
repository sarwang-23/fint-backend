
import { Injectable, NotFoundException } from '@nestjs/common';
import { InvestmentRepository } from './investment.repository';
import { CreateInvestmentDto } from './investment.dto';

@Injectable()
export class InvestmentService {
  constructor(private readonly investmentRepository: InvestmentRepository) {}

  create(userId: string, dto: CreateInvestmentDto) {
    return this.investmentRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.investmentRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const investment = await this.investmentRepository.findOne(id);
    if (!investment) {
      throw new NotFoundException(`Investment with id ${id} not found`);
    }
    return investment;
  }

  async update(id: string, dto: Partial<CreateInvestmentDto>) {
    await this.findOne(id);
    return this.investmentRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.investmentRepository.remove(id);
  }
}