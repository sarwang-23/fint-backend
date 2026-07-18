
import { Injectable, NotFoundException } from '@nestjs/common';
import { InsuranceRepository } from './insurance.repository';
import { CreateInsuranceDto } from './insurance.dto';

@Injectable()
export class InsuranceService {
  constructor(private readonly insuranceRepository: InsuranceRepository) {}

  create(userId: string, dto: CreateInsuranceDto) {
    return this.insuranceRepository.create(userId, dto);
  }

  findAll(userId: string) {
    return this.insuranceRepository.findAllByUser(userId);
  }

  async findOne(id: string) {
    const insurance = await this.insuranceRepository.findOne(id);
    if (!insurance) {
      throw new NotFoundException(`Insurance with id ${id} not found`);
    }
    return insurance;
  }

  async update(id: string, dto: Partial<CreateInsuranceDto>) {
    await this.findOne(id);
    return this.insuranceRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.insuranceRepository.remove(id);
  }
}